jQuery.sap.declare("sap.secmon.ui.m.anomaly.ui.Constants");

// Constants

sap.secmon.ui.m.anomaly.ui.Constants = {

    C_ODATA_QUBE_LIST_PATH : "/sap/secmon/ui/browse/services2/Qube.xsodata",
    C_TAG_PATH : "/sap/secmon/services/ui/commons/Tags.xsjs",
    C_ANOMALY_OBJECT_LIST_PATH : "/sap/secmon/services/ui/m/anomaly/AnomalyObjectsHeaderList.xsjs",
    C_ANOMALY_CONFIGURATION_PATH : "/sap/secmon/services/ui/m/anomaly/AnomalyConfiguration.xsjs",
    C_EXPORT_SERVICE : "/sap/secmon/services/replication/export.xsjs",
    C_NAMESPACE_ORIGINAL_IN_SYSTEM : "/sap/secmon/services/ui/m/namespace/system_namespace.xsodata",
    C_ANOMALY_PATTERN_LIST : "/sap/secmon/services/ui/m/anomaly/AnomalyPatternDataInformation.xsodata",
    C_ANOMALY_PATTERN_DATA : "/sap/secmon/services/ui/m/anomaly/featureSpace.xsjs",
    C_EVALUATION_DATA_RESET : "/sap/secmon/services/ui/m/anomaly/EvaluationDataReset.xsjs",

    C_OBJECT_TYPE : {
        ALL : "All",
        SCENARIO : "Scenario",
        FEATURE : "Feature",
        PATTERN : "Pattern",
        DIMENSIONS : "Dimensions"
    },

    C_NOTIFICATION_TYPE : {
        ALERT : "ALERT",
        INDICATOR : "INDICATOR"
    },
    C_AGGREGATION_METHOD : {
        SND : "calculateMeansAndStdDeviation_sameWeekDayTime",
        RVM : "BINARY"
    },

    C_AGGREGATION_TIME_UNIT : {
        HOURLY_DAY : "\"_SYS_BIC\".\"sap.secmon.db.statisticalview/DayHourRawDataView\"",
        QUARTERLY_DAY : "\"_SYS_BIC\".\"sap.secmon.db.statisticalview/DayQuarterHourRawDataView\""
    },

    C_AGGREGATION_TIME_UNIT_PIVOT : {
        HOURLY_DAY : "\"_SYS_BIC\".\"sap.secmon.db.statisticalview/DayHourDataAggregationPivotView\"",
        QUARTERLY_DAY : "\"_SYS_BIC\".\"sap.secmon.db.statisticalview/DayQuarterHourDataAggregationPivotView\""
    },
    C_SCOREFUNCTION : {
        MIN : "MIN",
        MAX : "MAX",
        AVG : "AVG"
    }
};