jQuery.sap.declare("sap.secmon.ui.m.anomaly.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.anomaly.ui.Constants");

sap.secmon.ui.m.anomaly.util.Formatter = {
        titleFormatter : function(sType, sName, sNamespace, evaluationText, patternText) {
            var sTitel;
            if ((!evaluationText) || (!patternText) ) {
                return;
            }
            if (sType === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE) {
                sTitel = evaluationText;
            } else if (sType === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN) {
                sTitel = patternText;
            }
            if (sName && sNamespace && sTitel) {
                return sTitel + ': ' + sNamespace + ': ' + sName;
            } else {
                return sTitel + ': ' + sName;
            }
        },
        exportButtonToolTipText : function(text, name, namespace) {
            return sap.secmon.ui.m.anomaly.util.Formatter.textWithNameAndNameSpace(text, '', name, namespace);
        },
        analysisTooltipFormatter :  function(name, namespace, analysisTextWithParamters, generalAnalysisText) {
            if (name && namespace) {
                return sap.secmon.ui.commons.Formatter.i18nText(analysisTextWithParamters, namespace, name); 
            }
            return generalAnalysisText;
        },
        isPatternAndHasId : function(id, type, bPrivilege) {
            if(!bPrivilege || !id){
                return false;
            } else {
                return sap.secmon.ui.m.anomaly.util.Formatter.isPattern(type);  
            }
        },
        isScenarioAndHasId : function(id, type, bPrivilege) {
            return (id && sap.secmon.ui.m.anomaly.util.Formatter.isScenario(type, bPrivilege));
        },
        isPattern :  function(sType) {
            return (sType === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN); 
        },
        isScenario : function(sType, bPrivilege) {
            if (sType === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO && bPrivilege){
                return true;
            }else{
                return false;
            }
        },
        textWithNameAndNameSpace : function(text, alternativeText, name, namespace) {
            if(name && namespace) {
                return sap.secmon.ui.commons.Formatter.i18nText(text, namespace, name);
            }
            return alternativeText;
        },
        invert : function(toBeInvertedBoolean) {
            if(toBeInvertedBoolean) {
                return false;
            }
            return true;
        },
        hasValue : function(value) {
            if (value) {
                return true;
            }
            return false;
        }
        
};