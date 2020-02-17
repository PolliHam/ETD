//Constants
// jshint unused:false
jQuery.sap.declare("sap.secmon.ui.browse.Constants");

sap.secmon.ui.browse.Constants = {
    C_ETD : {
        EVENT_CHANNEL : "sap.secmon.ui.browse",

        EVENT_SHOW_DATA : "ShowData",
        EVENT_SHOW_ORIGINAL_DATA : "ShowOriginalData",
        EVENT_WORKSPACE_CHANGED : "WorkSpaceChanged",
        EVENT_EXPAND_WORKSPACE : "ExpandWorkspace",
        EVENT_EXPAND_CHART : "ExpandChart",
        EVENT_EXIT_FULL_SCREEN : "ExitFullScreen",
        EVENT_ADD_NAMESPACE : "AddNamespace",
        EVENT_ADD_FILTER : "AddFilter",
        EVENT_SUBSET_DELETED : "SubsetDeleted",
        EVENT_PATH_DELETED : "PathDeleted",
        EVENT_PATTERN_CHANGED : "PatternConfigChanged",
        EVENT_SHOW_ALERT_GRAPH : "ShowAlertGraph",
        EVENT_OPEN_CASEFILE : "OpenCasefile"
    },
    C_DATA_TYPE : {
        TIMESTAMP : "ValueTimeStamp",
        INTEGER : "ValueInteger",
        BIG_INTEGER : "ValueBigInt",
        DOUBLE : "ValueDouble",
        NUMBER : "ValueNumber"
    },
    C_TIMERANGE : {
        TYPE_RELATIVE : "Relative",
        TYPE_ABSOLUTE : "Absolute",
        LAST_YEAR : "lastYear",
        LAST_MONTH : "lastMonth",
        LAST_WEEK : "lastWeek",
        LAST_DAY : "lastDay",
        LAST_HOUR : "lastHour",
        LAST_MINUTE : "lastMinute",
    },
    C_SERVICE_OPERATION : {
        GET_CONTEXT_LIST : "getContextList",
        GET_TIMERANGE_LIST : "getTimeRanges",
        GET_FIELD_LIST : "getFieldList",
        GET_FILTER_VALUES : "getFilterValues",
        GET_RECORDS_COUNT : "getRecordsCount",
        CREATE_CHART : "createChart",
        CREATE_PATTERN : "createPattern",
        GET_HEADER_IDS : "getHeaderIds",
        GET_KEY_4_HEADER_IDS : "getKeyForHeaderIds",
        GET_MULTI_RECORDS_COUNT : "getMultipleRecordsCount"
    },
    C_SERVICE_PATH : "/sap/secmon/ui/browse/services2/queryBuilder.xsjs",
    C_ODATA_ALERTS_PATH : "/sap/secmon/ui/browse/services2/alerts.xsodata",
    C_ODATA_LOGS_PATH : "/sap/secmon/ui/browse/services2/logEntries.xsodata",
    C_ODATA_HEALTHCHECKS_PATH : "/sap/secmon/ui/browse/services2/healthCheckEntries.xsodata",
    C_ODATA_CONFIGCHECKS_PATH : "/sap/secmon/ui/browse/services2/configCheckEntries.xsodata",
    C_ODATA_LOGS_PATH_XSJS : "/sap/secmon/ui/browse/services2/logEntries.xsjs",
    C_ODATA_PATTERNCONFIG_PATH : "/sap/secmon/ui/browse/services2/PatternConfig.xsodata",
    C_ODATA_GENERIC_ENUM_PATH : "/sap/secmon/services/genericEnum.xsodata",
    C_ODATA_VALUE_LISTS_PATH : "/sap/secmon/services/ui/m/valuelist/valuelist.xsodata",
    C_ODATA_ALL_PATTERNS : "/sap/secmon/trigger/TriggerPattern.xsodata",
    C_ODATA_ALL_SEMANTIC_EVENTS : "/sap/secmon/trigger/TriggerSemanticEvent.xsodata",
    C_ODATA_NAVIGATION_PATH : "/sap/secmon/ui/browse/services2/navigation.xsodata",

    C_VALUE : {
        NULL : "__null__",
        EMPTY : "__empty__"
    },

    C_ODATA_NAMESPACE : {
        URL : "sap/secmon/services",
        SERVICE : "NameSpacesOriginalInSystem.xsodata",
        RESOURCE : "NameSpaceOriginalInSystem"
    },

    C_ODATA_QUBE_LIST_PATH : "/sap/secmon/ui/browse/services2/Qube.xsodata",
    C_DOWNLOAD_WORKSPACE_PATH : "/sap/secmon/ui/browse/services2/getWorkspace.xsjs?workspaceId=",
    C_QUBE_DML_PATH : "/sap/secmon/ui/browse/services2/qubeDML.xsjs",
    C_USAGES_TRIGGER_PATH : "/sap/secmon/ui/browse/services2/getUsageOfTrigger.xsjs?triggerId=",

    C_SQL_FN : {
        AVG : "AVG",
        COUNT : "COUNT",
        MAX : "MAX",
        MIN : "MIN",
        SUM : "SUM"
    },

    C_SQL_STAR : "*",

    C_MODEL_SIZE_LIMIT : {
        FIELD_LIST : 500,
        VALUE_LIST : 500,
        TRIGGER_LIST : 500,
    },

    C_CHART_TYPE : {
        BAR : "bar",
        TREEMAP : "treemap",
        TABLE : "table",
        COLUMN : "column",
        LINE : "line",
        PIE : "pie",
        DONUT : "donut",
    },

    C_TIMESTAMP_ATTRIBUTES : {
        TIMESTAMP_OF_END : "56424E701B2FA51BE22A044B51CC7B4D",
        PARAMETER_VALUE_TIMESTAMP : "56424E4B1B2FA51BE22A044B51CC7B4D",
        PARAM_VALUE_TIMESTAMP_PRIOR_VALUE : "56424E4C1B2FA51BE22A044B51CC7B4D",
        START_TIMESTAMP : "56424E711B2FA51BE22A044B51CC7B4D",
        TECHNICAL_TIMESTAMP_INSERTION : "56B862E7EF19B60DE200F19A9E3CE568",
        TIMESTAMP : "53CDE6090DC572EEE10000000A4CF109"
    },

    C_USERNAME_ATTRIBUTES : {
        USERNAME_ACTING : {
            key : "CDD099D3A11E677C16007C2857BE5C6B",
            name : "UsernameActing"
        },
        USERNAME_INIT : {
            key : "72E099D3A11E677C16007C2857BE5C6B",
            name : "UsernameInitiating"
        },
        USERNAME_TARGETED : {
            key : "4BE199D3A11E677C16007C2857BE5C6B",
            name : "UsernameTargeted"
        },
        USERNAME_TARGETING : {
            key : "21E299D3A11E677C16007C2857BE5C6B",
            name : "UsernameTargeting"
        }
    },

    C_ROLE_INDEPENDENT_ATTRIBUTES : {
        "05CC84C97AA2CACC16007C280168450F" : "Network, IP Address <Role-Independent>",
        "19CC84C97AA2CACC16007C280168450F" : "Network, Hostname <Role-Independent>",
        "497B8AC97AA2CACC16007C280168450F" : "User Pseudonym, <Role-Independent>"
    },

    C_ARTIFACT_TYPE : {
        PATTERN : "Pattern",
        CHART : "Chart",
        RAWDATA : "RawData",
        ORIGINALDATA : "OriginalData",
        BROWSINGCHART : "BrowsingChart",
    },

    C_BROWSING_CONTEXT : {
        LOG : "Log",
        ALERT : "Alert",
        HEALTH_CHECK : "HealthCheck",
        CONFIG_CHECK : "ConfigurationCheck",
    // INSPECTION : "Inspection",
    },

    C_BROWSING_VIEW : {
        BUBBLEGRAM : "Bubblegram",
        BROWSING_CHART : "BrowsingChart",
        TABLE : "Table",
    },

    C_ARTIFACT_SIZE : {
        HIGHLIGHTED : "3rem",
        DEFAULT : "2.5rem",
    },

    // SCHDL:SEMEV:WRKFL
    C_PATTERN_EXEC_TYPE : {
        SCHEDULED : "SCHDL",
        TRIGGERED : "TRIG",
    },

    C_PATTERN_TRIGGER_TYPE : {
        EVENT : "SEMEV",
        PATTERN : "WRKFL",
    },

    C_FILTER_VALUE : {
        MAX_LENGTH : 512,
    },

    C_ABS_TIME_LIST : [ {
        time : "00:00"
    }, {
        time : "01:00"
    }, {
        time : "02:00"
    }, {
        time : "03:00"
    }, {
        time : "04:00"
    }, {
        time : "05:00"
    }, {
        time : "06:00"
    }, {
        time : "07:00"
    }, {
        time : "08:00"
    }, {
        time : "09:00"
    }, {
        time : "10:00"
    }, {
        time : "11:00"
    }, {
        time : "12:00"
    }, {
        time : "13:00"
    }, {
        time : "14:00"
    }, {
        time : "15:00"
    }, {
        time : "16:00"
    }, {
        time : "17:00"
    }, {
        time : "18:00"
    }, {
        time : "19:00"
    }, {
        time : "20:00"
    }, {
        time : "21:00"
    }, {
        time : "22:00"
    }, {
        time : "23:00"
    } ],

    C_REL_TIME_LIST : {
        "lastMinute" : 60000,
        "last2Minutes" : 120000,
        "last5Minutes" : 300000,
        "last10Minutes" : 600000,
        "last15Minutes" : 900000,
        "last20Minutes" : 1200000,
        "last25Minutes" : 1500000,
        "last30Minutes" : 1800000,
        "last35Minutes" : 2100000,
        "last40Minutes" : 2400000,
        "last45Minutes" : 2700000,
        "last50Minutes" : 3000000,
        "last55Minutes" : 3300000,
        "lastHour" : 3600000,
        "last2Hours" : 7200000,
        "last8Hours" : 28800000,
        "lastDay" : 86400000,
        "last2Days" : 172800000,
        "lastWeek" : 604800000,
        "lastMonth" : 2592000000,
        "lastYear" : 31536000000,

    }

};
