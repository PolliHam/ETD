jQuery.sap.declare("sap.secmon.ui.configCheck.Formatter");
sap.secmon.ui.configCheck.Formatter = {
    formatIconSrc : function(status) {
        switch (status) {
        case 0:
            return "sap-icon://status-positive";
        case 1:
            return "sap-icon://status-positive";
        case 3:
            return "sap-icon://status-critical";
        case 4:
            return "sap-icon://status-critical";
        default:
            return "sap-icon://status-inactive";
        }
    },
    formatIconColor : function(status) {
        switch (status) {
        case 0:
            return "#4CFF33";
        case 1:
            return "#33FF90";
        case 2:
            return "#F5E705";
        case 3:
            return "#ED560A";
        case 4:
            return "#ED0A0A";
        default:
            return "grey";
        }
    },
    formatIconTooltip : function(status, sVerySecure, sSecure, sMedium, sCritial, sVeryCritical, sNoResult) {
        switch (status) {
        case 0:
            return sVerySecure;
        case 1:
            return sSecure;
        case 2:
            return sMedium;
        case 3:
            return sCritial;
        case 4:
            return sVeryCritical;
        default:
            return sNoResult;
        }
    },
    RoleFormatter : function(sRole, sNoRole) {
        if (sRole === "") {
            return sNoRole;
        }
        return sRole;
    }
};
