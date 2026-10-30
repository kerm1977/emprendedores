import json
import time
import uuid
from datetime import datetime, timedelta
from eventos_store import CR, CAMPOS, historial


def importar_ferias(db):
    if db.execute("SELECT 1 FROM eventos_meta WHERE clave='ferias-importadas'").fetchone():
        return
    if not db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='app_data'").fetchone():
        return
    row = db.execute('SELECT json FROM app_data WHERE id=1').fetchone()
    if not row:
        return
    try:
        catalogo = json.loads(row['json'])
    except (ValueError, TypeError):
        return
    if not isinstance(catalogo, dict):
        return
    antiguos = catalogo.get('ferias') or catalogo.get('notas') or []
    if not isinstance(antiguos, list):
        return
    cfg = json.loads(db.execute('SELECT data FROM eventos_config WHERE id=1').fetchone()['data'])
    etiqueta = cfg['etiquetas'][0]
    db.execute('BEGIN IMMEDIATE')
    if db.execute("SELECT 1 FROM eventos_meta WHERE clave='ferias-importadas'").fetchone():
        db.rollback()
        return
    for indice, n in enumerate(antiguos):
        if not isinstance(n, dict):
            continue
        datos = dict(n)
        datos.update({k: str(n.get(k) or '') for k in CAMPOS})
        datos.update(etiqueta=etiqueta['id'], etiquetaNombre=etiqueta['nombre'])
        expires = 0
        try:
            inicio = datetime.strptime(datos['fecha']+' '+datos['horaInicio'], '%Y-%m-%d %H:%M').replace(tzinfo=CR)
            fin = datetime.strptime(datos['fecha']+' '+datos['horaFin'], '%Y-%m-%d %H:%M').replace(tzinfo=CR)
            if fin < inicio:
                fin += timedelta(days=1)
            datos.update(inicio=inicio.timestamp(), fin=fin.timestamp())
            expires = (fin + timedelta(hours=24)).timestamp()
        except ValueError:
            pass
        identificador = 'legado-' + uuid.uuid5(uuid.NAMESPACE_OID, str(n.get('id', indice))+':'+str(indice)).hex
        owner = str(n.get('owner') or '').strip().lower()
        if '@' not in owner:
            owner = ''
        db.execute('INSERT OR IGNORE INTO eventos VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', (identificador, owner, None, json.dumps(datos, ensure_ascii=False), None, '{}', 'pendiente', 'Feria anterior: revisar datos y tarifa; autoría no inferida del contacto', None, 1, time.time(), time.time(), expires))
        registro = db.execute('SELECT * FROM eventos WHERE id=?', (identificador,)).fetchone()
        historial(db, registro, None, 'importado-pendiente')
    db.execute("INSERT INTO eventos_meta VALUES ('ferias-importadas','1')")
    db.commit()
