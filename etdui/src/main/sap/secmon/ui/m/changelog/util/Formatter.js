jQuery.sap.declare("sap.secmon.ui.m.changelog.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.EnumService");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");

/**
 * Make some formatters globally available.
 */
sap.secmon.ui.m.changelog.util.Formatter = {
    oEnumService : new sap.secmon.ui.commons.EnumService(),

    entityTypeFormatter : function(entityType) {
        var enumsModel = this.getModel("enums");
        if (enumsModel === undefined) {
            return entityType;
        } else {
            return sap.secmon.ui.m.changelog.util.Formatter.oEnumService.getEnumValue(enumsModel, "/sap.secmon.services.protocol/Protocol/EntityType/", entityType);
        }
    },

    entityOperationFormatter : function(entityOperation) {
        var enumsModel = this.getModel("enums");
        if (enumsModel === undefined) {
            return entityOperation;
        } else {
            return sap.secmon.ui.m.changelog.util.Formatter.oEnumService.getEnumValue(enumsModel, "/sap.secmon.services.protocol/Protocol/EntityOperation/", entityOperation);
        }
    },

    entityNamespaceFormatter : function(entityNamespace, sEmptyNamespace) {
        if (entityNamespace === "") {
            return sEmptyNamespace;
        }
        return entityNamespace;
    },

    columnListItemTypeFormatter : function(serializedObjectOldLength, serializedObjectNewLength) {
        if (serializedObjectOldLength === undefined || serializedObjectNewLength === undefined) {
            return "Inactive";
        }
        var sum = (+serializedObjectOldLength) + (+serializedObjectNewLength);
        if (sum === 0) {
            return "Inactive";
        }
        return "Navigation";
    },

    entityHistoryURL : function(entityId, entityType) {
        if (entityType === 'ALERT' && entityId) {
            return sap.secmon.ui.m.commons.NavigationService.alertURL(entityId, "Comments");
        }
        if (entityType === 'INVESTIGATION' && entityId) {
            return sap.secmon.ui.m.commons.NavigationService.investigationURL(entityId, "discussion");
        }
    },

    entityHistoryURLEnabled : function(entityType) {
        return entityType === 'ALERT' || entityType === 'INVESTIGATION';
    }

};
