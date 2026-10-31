@echo off
title AgendaTribu - Todo en uno
rem Un solo clic: abre el watchdog del servidor y el listener de Devin
start /min "AgendaTribu Antimuerte" "C:\AgendaTribu\antimuerte.bat"
start /min "Listener Devin" cmd /c "C:\Users\MINIOS\AppData\Local\Programs\Python\Python313\python.exe" "C:\Users\MINIOS\AGENDATRIBUFLASK\herramientas\escuchar_instrucciones.py" ^& pause
exit
