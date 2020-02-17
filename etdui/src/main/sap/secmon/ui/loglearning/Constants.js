jQuery.sap.declare("sap.secmon.ui.loglearning.Constants");

sap.secmon.ui.loglearning.Constants = {

    AVAILABLE_ANNOTATIONS : [ {
        key : "Word",
        text : "Word"
    }, {
        key : "Integer",
        text : "Integer"
    }, {
        key : "Var",
        text : "Var"
    }, {
        key : "Timestamp",
        text : "Timestamp"
    }, {
        key : "Host",
        text : "Host"
    }, {
        key : "FilePath",
        text : "FilePath"
    }, {
        key : "IP.IP",
        text : "IP.IP"
    }, {
        key : "IP.PORT",
        text : "IP.PORT"
    }, {
        key : "Url",
        text : "Url"
    }, {
        key : "Syslog",
        text : "Syslog"
    }, {
        key : "Symbolic",
        text : "Symbolic"
    }, {
        key : "MAC",
        text : "MAC"
    } ],

    ANNOTATION_TYPES : {
        BASE : "BASE",
        WORD : "Word",
        TIMESTAMP : "Timestamp",
        MAC : "MAC",
        BLANK_OR_PUNCTUATION : "BlankOrPunctuation"
    },

    ANNOTATION_POSITION : {
        BEFORE : "Before",
        AFTER : "After"
    },

    ROUTES : {

        ENTRY_TYPES : {
            TAB_KEY : "itemStagingEntryTypes",
            ROUTE : "entryTypes",
            VIEW_ID : "viewStagingEntryTypes",
            VIEW_NAME : "sap.secmon.ui.loglearning.stagingEntryTypes"
        },
        ENTRY_TYPE : {
            /** Comment: This tab key is virtual. The tab bar does not have a tab key for entry type details. The entry type details is displayed under tab "entryTypes". */
            TAB_KEY : "itemStagingEntryTypeDetails",
            ROUTE : "entryTypeDetails",
            VIEW_ID : "viewStagingEntryTypeDetails",
            VIEW_NAME : "sap.secmon.ui.loglearning.StagingEntryTypeDetails"
        },
        RUNTIME_RULES : {
            TAB_KEY : "itemStagingRuntimeRules",
            ROUTE : "runtimeRules",
            VIEW_ID : "viewStagingRuntimeRules",
            VIEW_NAME : "sap.secmon.ui.loglearning.stagingRuntimeRules"
        },
        TEST_RESULTS : {
            TAB_KEY : "itemStagingLog",
            ROUTE : "testResults",
            VIEW_ID : "viewStagingLog",
            VIEW_NAME : "sap.secmon.ui.loglearning.stagingLog"
        },
        PARAMETERS : {
            TAB_KEY : "itemRunOverview",
            ROUTE : "parameters",
            VIEW_ID : "viewRunOverview",
            VIEW_NAME : "sap.secmon.ui.loglearning.runOverview"
        },
        PROTOCOL : {
            TAB_KEY : "itemProtocol",
            ROUTE : "protocol",
            VIEW_ID : "viewProtocol",
            VIEW_NAME : "sap.secmon.ui.loglearning.protocol"
        }
    }

};
