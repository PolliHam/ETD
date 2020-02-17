jQuery.sap.declare("sap.secmon.ui.systems.Constants");

sap.secmon.ui.systems.Constants = {
    // Constants
    C_SERVICE_PATH : {
        SYSTEMS : "/sap/secmon/services/ui/systemcontext/SystemData.xsodata",
        LOCATIONS : "/sap/secmon/services/ui/locations/Locations.xsodata",
        REPLICATION : "/sap/secmon/services/replication/export.xsjs",
        STATUS : "/sap/secmon/services/genericEnum.xsodata/Enum?$filter=Package%20eq%20'sap.secmon.services.ui.systemcontext'%20and%20Attribute%20eq%20'Status'",
        ENUM : "/sap/secmon/services/genericEnum.xsodata",
        CONFIDENTIALITY : "/Enum?$filter=Package%20eq%20'sap.secmon.services.ui.systemcontext'%20and%20Attribute%20eq%20'Confidentiality'",
        INTEGRITY_SYSTEM : "/Enum?$filter=Package%20eq%20'sap.secmon.services.ui.systemcontext'%20and%20Attribute%20eq%20'IntegritySystem'",
        INTEGRITY_DATA : "/Enum?$filter=Package%20eq%20'sap.secmon.services.ui.systemcontext'%20and%20Attribute%20eq%20'IntegrityData'",
        AVAILABILITY : "/Enum?$filter=Package%20eq%20'sap.secmon.services.ui.systemcontext'%20and%20Attribute%20eq%20'Availability'"

    },

    C_STATUS : {
        INACTIVE : "I",
        ACTIVE : "A"
    },
    C_FILTERS_AND_SORTERS : {
        ID : "Id",
        TYPE : "Type",
        MAIN_SYSTEM_ID : "MainSystemId",
        MAIN_SYSTEM_TYPE : "MainSystemType",
        ROLE : "Role",
        STATUS : "Status",
        ORDER_BY : "OrderBy",
        ORDER_DESC : "OrderDesc",
        CREATED_BY : "CreatedBy",
        CREATED_AT : "CreatedAt"
    },
    STATUS : {
        ACTIVE : "ACTIVE",
        INACTIVE : "INACTIVE",
        isSupported : function(sFilter) {
            for ( var prop in this) {
                if (this[prop] === sFilter) {
                    return true;
                }
            }
            return false;
        }
    },
};