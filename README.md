# sails_mongo_admin
Simple administrador de DB basado en mongo-express con capacidad para editar DB modeladas con waterline.

ver:  [https://github.com/andzdroid/mongo-express](mongo-express)

renombra o copia config.defualt.js a config.js y edita/agrega:
    sailsPaths:['/home/user/repo/sailsApp/']
para indicar las rutas absolutas a las aplicaciones sailsjs, para que el administrador tome 
los archivos de configuracion de los modelos y pueda armar las relaciones correspondientes.
