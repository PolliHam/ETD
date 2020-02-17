jQuery.sap.declare("sap.secmon.ui.m.anomaly.ui.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.EnumService");
jQuery.sap.require("sap.secmon.ui.m.anomaly.ui.Constants");

sap.secmon.ui.m.anomaly.ui.Formatter = {
    DateFormatter : sap.ui.core.format.DateFormat.getDateInstance({
        locale : sap.ui.getCore().getConfiguration().getLanguage()
    }),
    oEnumService : new sap.secmon.ui.commons.EnumService(),

    getText : function(sTextKey) {
        return this.getModel("i18n").getProperty(sTextKey);
    },
    typeFormatter : function(type) {
        var enumsModel = this.getModel("enums");
        /*
         * The view (this) is sometimes rendered the first time, before it is included into the view hierarchy. In this case, the model is not yet found. After that, it is rendered again, and
         * everything is fine.
         */
        if (enumsModel === undefined) {
            return type;
        } else {
            return sap.secmon.ui.m.anomaly.ui.Formatter.oEnumService.getEnumValue(enumsModel, "/sap.secmon.services.ui.m.anomaly/AnomalyDetectionPattern/Type/", type);
        }
    },
    enabledFormatter : function(type, id) {
        if (!type) {
            return false;
        }
        if (type !== "Scenario" && !id) {
            return false;
        }
        return true;
    },
    newEnabledFormatter : function(type, id) {
        if (!type) {
            return true;
        }
        if (type === "Scenario") {
            return true;
        }
        return false;

    },
    iconFormatter : function(type) {
        switch (type) {
        case 'Pattern':
            return "sap-icon://puzzle";
        case 'Feature':
            return "sap-icon://bar-chart";
        case "Scenario":
            return "sap-icon://upstacked-chart";
        default:
            return "";
        }
    },
    formatSave : function(sType) {
        switch (sType) {
        case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO:
            return this.getModel("i18n").getProperty("SaveScenario_BUT");
        case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE:
            return this.getModel("i18n").getProperty("SaveEvaluation_BUT");
        case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN:
            return this.getModel("i18n").getProperty("SavePattern_BUT");
        default:
            return "";
        }
    },
    formatSaveVisiblity : function(sType, sNamespace, bIsNonOriginal, bAnomalyDetectionWrite) {
        var res = false;
        if ((sNamespace === null || bIsNonOriginal !== true) && bAnomalyDetectionWrite === true) {
            res = true;
        } else if ((sType === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO || 
            sType === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN) && bIsNonOriginal === true && bAnomalyDetectionWrite === true) {
            res = true;
        }
        return res;
    },
    formatSaveAsVisiblity : function(sNamespace, bAnomalyDetectionWrite) {
        var res = false;
        if (sNamespace !== null && bAnomalyDetectionWrite) {
            res = true;
        }
        return res;
    },
    formatSaveAs : function(sType) {
        switch (sType) {
        case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO:
            return this.getModel("i18n").getProperty("SaveScenarioAs_BUT");
        case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE:
            return this.getModel("i18n").getProperty("SaveEvaluationAs_BUT");
        case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN:
            return this.getModel("i18n").getProperty("SavePatternAs_BUT");
        default:
            return "";
        }
    },
    formatDelete : function(sType) {
        switch (sType) {
        case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO:
            return this.getModel("i18n").getProperty("DeleteScenario_BUT");
        case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE:
            return this.getModel("i18n").getProperty("DeleteEvaluation_BUT");
        case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN:
            return this.getModel("i18n").getProperty("DeletePattern_BUT");
        default:
            return "";
        }
    },
    formatDeleteVisibility : function(sNamespace, bIsNonOriginal, bAnomalyDetectionWrite) {
        var res = false;
        if (sNamespace !== null && bIsNonOriginal !== true && bAnomalyDetectionWrite === true) {
            res = true;
        }
        return res;
    },
    formatScenOpVisiblity : function(sType, bIsNonOriginal, bAnomalyDetectionWrite) {
        if (sType === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO &&
            bIsNonOriginal !== true &&
            bAnomalyDetectionWrite === true) {
            return true;
        } else {
            return false;
        }
    },
    formatName : function(sType, sName, sNamespace) {
        if (sType) {
            var sTypeDisplay = "";
            switch (sType) {
            case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO:
                sTypeDisplay = this.getModel("i18n").getProperty("Scenario_TXT");
                break;
            case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE:
                sTypeDisplay = this.getModel("i18n").getProperty("Evaluation_TXT");
                break;
            case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN:
                sTypeDisplay = this.getModel("i18n").getProperty("Pattern_TXT");
                break;
            }
            if (sName && sNamespace) {
                return sTypeDisplay + ': ' + sNamespace + ': ' + sName;
            } else {
                return sTypeDisplay + ': ' + sName;
            }
        }
    }

};
