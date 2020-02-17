// jshint unused:false

//var MALIMON = {
//    C_NODE_TYPE : {
//        DEVICE : "Device",
//        URL : "Url",
//        USER : "User",
//        FIREWALL_HOST : "FirewallHost",
//        FIREWALL_RULE : "FirewallRule",
//        FIREWALL_TAREGET : "FirewallTarget",
//        HOST_NAME : "Hostname",
//        MAC_ADDRESS : "MACAddress"
//    }
//};

// var C_ODATA_QUBE_LIST_PATH = "/sap/secmon/ui/browse/services2/Qube.xsodata";
jQuery.sap.declare("sap.secmon.ui.malimon.Constants");

sap.secmon.ui.malimon.Constants = {
    C_TYPE: {
        INVESTIGATION: "Investigation",
        ALERT: "Alert",
        PATTERN: "Pattern",
        EVENT: "Event",
        HEALTHCHECK: "HealthCheck",
        CONFIGCHECK: "ConfigCheck",
        BINARY: "Edm.Binary",
        DATETIME: "Edm.DateTime",
        TIMESTAMP: "Timestamp",
        MINTIMESTAMP: "MinTimestamp",
        MAXTIMESTAMP: "MaxTimestamp",
        EVENT_NAME: "EventName",
        ID: "Id"
    },

    C_LOG_EVENTS_GET_PATH: "/sap/secmon/ui/browse/services2/logEvents.xsjs",

    C_CASEFILE_GET_PATH: "/sap/secmon/services/malimon/getCaseFile.xsjs",

    C_SAVE_CASE_FILE: {
        PATH: "/sap/secmon/services/malimon/saveAttackPath.xsjs",
        ATTRIBUTE_ID: "?caseFileId="
    },

    C_SELECTED_FIELDS: {
        LOG: "$select=Id,Timestamp,EventName,EventLogType",
        // +
        // ",AttackName,AttackType,EventMessage,EventSourceType,GenericAction"
        // + ",GenericPath,GenericURI,GenericCategory"
        // +
        // ",NetworkHostnameActor,NetworkHostnameInitiator,NetworkHostnameIntermediary,NetworkHostnameReporter,NetworkHostnameTarget"
        // +
        // ",NetworkIPAddressActor,NetworkIPAddressInitiator,NetworkIPAddressIntermediary,NetworkIPAddressReporter,NetworkIPAddressTarget"
        // +
        // ",NetworkMACAddressActor,NetworkMACAddressInitiator,NetworkMACAddressIntermediary,NetworkMACAddressReporter,NetworkMACAddressTarget"
        // +
        // ",NetworkPortActor,NetworkPortInitiator,NetworkPortIntermediary,NetworkPortTarget,NetworkPortReporter"
        // + ",NetworkPortBeforeNATActor,NetworkPortBeforeNATTarget"
        // +
        // ",ServiceFunctionName,ServiceApplicationName,ServiceExecutableName,ServiceExecutableType,ServiceInstanceName,ServiceOutcome,ServiceProgramName,ServiceTransactionName"
        // + ",ServiceUserAgent,NetworkSubnetCategoryInitiator,UserLogonMethod"
        // +
        // ",SystemIdActor,SystemIdInitiator,SystemIdIntermediary,SystemIdReporter,
        // SystemIdTarget"
        // +
        // ",UserPseudonymActing,UserPseudonymInitiating,UserPseudonymTargeted,UserPseudonymTargeting",

        ALERT: "$select=AlertId,Timestamp,EventName,Number,Severity,Status,Score,Processor,MinTimestamp,MaxTimestamp,Count,PatternName,PatternNamespace",

        CONFIGCHECK: "$select=TechnicalId,Timestamp,CheckName,SystemIdActor,SystemTypeActor,HostNameActor,IPAddressActor,StatusDelta",

        HEALTHCHECK: "$select=HeaderId,Timestamp,SystemId,EventId,MessageText"

    },

    C_MAX_SHOWN_EVENTS: 100
};