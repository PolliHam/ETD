//Constants
// jshint unused:false
jQuery.sap.declare("sap.secmon.ui.ssm.Constants"),

sap.secmon.ui.ssm.Constants = {
    C_ETD : {
        EVENT_CHANNEL : "sap.secmon.ui.ssm",
        EVENT_CONFIG_CHANGED : "ConfigChanged",
    },

    C_SSM_VIEW_MODE : {
        SYSTEMS : "systems",
        NOTES : "notes"
    },

    C_SSM_MODEL : {
        DISPLAYNAMES : "DisplayNames"
    },

    C_SERVICE_PATH : "/sap/secmon/ui/browse/services2/queryBuilder.xsjs",

    C_ODATA_ALERTS_PATH : "/sap/secmon/ui/browse/services2/alerts.xsodata",
    C_ODATA_LOGS_PATH : "/sap/secmon/ui/browse/services2/logEntries.xsodata",
    C_ODATA_HEALTHCHECKS_PATH : "/sap/secmon/ui/browse/services2/healthCheckEntries.xsodata",
    C_ODATA_PATTERNCONFIG_PATH : "/sap/secmon/ui/browse/services2/PatternConfig.xsodata",
    C_ODATA_GENERIC_ENUM_PATH : "/sap/secmon/services/genericEnum.xsodata",
    C_ODATA_VALUE_LISTS_PATH : "/sap/secmon/services/ui/m/valuelist/valuelist.xsodata",
    C_ODATA_ALL_PATTERNS : "/sap/secmon/trigger/TriggerPattern.xsodata",
    C_ODATA_ALL_SEMANTIC_EVENTS : "/sap/secmon/trigger/TriggerSemanticEvent.xsodata",
    C_ODATA_NAVIGATION_PATH : "/sap/secmon/ui/browse/services2/navigation.xsodata"
};