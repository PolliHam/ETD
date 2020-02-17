jQuery.sap.declare("sap.secmon.ui.replication.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.EnumService");

sap.secmon.ui.replication.util.Formatter = {

    oEnumService : new sap.secmon.ui.commons.EnumService(),

    importOperationFormatter : function(operation) {
        var enumsModel = this.getModel("enums");
        /*
         * The view (this) is sometimes rendered the first time, before it is included into the view hierarchy. In this case, the model is not yet found. After that, it is rendered again, and
         * everything is fine.
         */
        if (enumsModel === undefined) {
            return operation;
        } else {
            return sap.secmon.ui.replication.util.Formatter.oEnumService.getEnumValue(enumsModel, "/sap.secmon.services.replication/Import/Operation/", operation);
        }
    },

    exportOperationFormatter : function(operation) {
        var enumsModel = this.getModel("enums");
        /*
         * The view (this) is sometimes rendered the first time, before it is included into the view hierarchy. In this case, the model is not yet found. After that, it is rendered again, and
         * everything is fine.
         */
        if (enumsModel === undefined) {
            return operation;
        } else {
            return sap.secmon.ui.replication.util.Formatter.oEnumService.getEnumValue(enumsModel, "/sap.secmon.services.replication/Export/Operation/", operation);
        }
    },

    errorLinkEnableFormatter : function(status) {
        return status === 'Error';
    },

    importStatusFormatter : function(status) {
        var enumsModel = this.getModel("enums");
        /*
         * The view (this) is sometimes rendered the first time, before it is included into the view hierarchy. In this case, the model is not yet found. After that, it is rendered again, and
         * everything is fine.
         */
        if (enumsModel === undefined) {
            return status;
        } else {
            return sap.secmon.ui.replication.util.Formatter.oEnumService.getEnumValue(enumsModel, "/sap.secmon.services.replication/Import/Status/", status);
        }
    },

    exportStatusFormatter : function(status) {
        var enumsModel = this.getModel("enums");
        /*
         * The view (this) is sometimes rendered the first time, before it is included into the view hierarchy. In this case, the model is not yet found. After that, it is rendered again, and
         * everything is fine.
         */
        if (enumsModel === undefined) {
            return status;
        } else {
            return sap.secmon.ui.replication.util.Formatter.oEnumService.getEnumValue(enumsModel, "/sap.secmon.services.replication/Export/Status/", status);
        }
    },

    importTypeFormatter : function(type) {
        var enumsModel = this.getModel("enums");
        /*
         * The view (this) is sometimes rendered the first time, before it is included into the view hierarchy. In this case, the model is not yet found. After that, it is rendered again, and
         * everything is fine.
         */
        if (enumsModel === undefined) {
            return type;
        } else {
            return sap.secmon.ui.replication.util.Formatter.oEnumService.getEnumValue(enumsModel, "/sap.secmon.services.replication/Import/ObjectType/", type);
        }
    },

    exportTypeFormatter : function(type) {
        var enumsModel = this.getModel("enums");
        /*
         * The view (this) is sometimes rendered the first time, before it is included into the view hierarchy. In this case, the model is not yet found. After that, it is rendered again, and
         * everything is fine.
         */
        if (enumsModel === undefined) {
            return type;
        } else {
            return sap.secmon.ui.replication.util.Formatter.oEnumService.getEnumValue(enumsModel, "/sap.secmon.services.replication/Export/ObjectType/", type);
        }
    },

    importAreaFormatter : function(area) {
        var enumsModel = this.getModel("enums");
        /*
         * The view (this) is sometimes rendered the first time, before it is included into the view hierarchy. In this case, the model is not yet found. After that, it is rendered again, and
         * everything is fine.
         */
        if (enumsModel === undefined) {
            return area;
        } else {
            return sap.secmon.ui.replication.util.Formatter.oEnumService.getEnumValue(enumsModel, "/sap.secmon.services.replication/Import/ObjectArea/", area);
        }
    },

    exportAreaFormatter : function(area) {
        var enumsModel = this.getModel("enums");
        /*
         * The view (this) is sometimes rendered the first time, before it is included into the view hierarchy. In this case, the model is not yet found. After that, it is rendered again, and
         * everything is fine.
         */
        if (enumsModel === undefined) {
            return area;
        } else {
            return sap.secmon.ui.replication.util.Formatter.oEnumService.getEnumValue(enumsModel, "/sap.secmon.services.replication/Export/ObjectArea/", area);
        }
    },

};
