jQuery.sap.declare("sap.secmon.ui.domainrating.Constants");

sap.secmon.ui.domainrating.Constants = {
    // Constants
    C_DOMAIN_RATING_PATH : "/sap/secmon/services/domainrating/DomainRating.xsjs",

    C_CLASSIFICATION_TYPE : {
        BENIGN : "B",
        MALICIOUS : "M"
    },
    C_VIEW_TYPE : {
        DOMAINLIST : "DL",
        WHITELIST : "WL"
    },
    C_FILTERS_AND_SORTERS : {
        VIEW_TYPE : "ViewType",
        TIMERANGE_TYPE : "TimerangeType",
        TIMERANGE_RELATIVE : "TimerangeRelative",
        TIMERANGE_FROM : "TimerangeFrom",
        TIMERANGE_TO : "TimerangeTo",
        DOMAIN : "Domain",
        TOPLEVELDOMAIN : "TopLevelDomain",
        CLASSIFICATION : "Classification",
        IS_CONFIRMED : "IsConfirmed",
        ORDER_BY : "OrderBy",
        ORDER_DESC : "OrderDesc",
        CREATED_BY : "CreatedBy",
        CREATED_AT : "CreatedAt"
    },
};