jQuery.sap.declare("sap.secmon.ui.m.views.pattern.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.UIUtils");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");

sap.secmon.ui.m.views.pattern.Formatter = {
    frequencyVisibility : function(sExecutionType, sPatternType) {
        return (sExecutionType === 'SCHDL' && sPatternType === 'FLAB');
    },
    isFLABPattern : function(sPatternType) {
        return sPatternType === 'FLAB';
    },
    numberFormatter : function(count) {
        return (count === undefined || count === null) ? 0 : count;
    },
    testMode : function(sTestMode) {
        return sTestMode === "TRUE";
    },
    tagEditableFormatter : function(sOriginal) {
        return (sOriginal === 1);
    },
    testModeToString : function(sTestMode) {
        var oView = sap.secmon.ui.commons.UIUtils.getView(this);
        if (oView === null || oView === undefined) {
            return sTestMode;
        }
        var sKey = sTestMode === "TRUE" ? "Yes_FLD" : "No_FLD";
        return oView.getController().getCommonText(sKey);
    },

    isAlertPattern : function(sExecutionOutput) {
        return sExecutionOutput === 'ALERT';
    },

    displayIconTabBar : function(displayMode, sExecutionOutput) {
        if (displayMode === true || displayMode === false && sExecutionOutput === "ALERT") {
            return true;
        }
        return false;
    },
    showExecuteButton : function(patternType) {
        return patternType === "FLAB";
    },

    setLineType : function(displayMode) {
        if (displayMode === true) {
            return "Navigation";
        } else {
            return "Inactive";
        }

    },
    tagNameFormatter : function(tagName, tagNamespace) {
        return tagName + " (" + tagNamespace + ")";
    }

};
