from flask import Blueprint, jsonify
from promo_auth import actor_promocion

cobro_bp = Blueprint('promociones_cobro', __name__)


@cobro_bp.post('/api/promociones/cobro')
def iniciar_cobro():
    actor_promocion()
    return jsonify(ok=False, habilitado=False, error='El cobro integrado no está habilitado. No se realizó ningún cargo. Usá la verificación del superusuario.'), 501
