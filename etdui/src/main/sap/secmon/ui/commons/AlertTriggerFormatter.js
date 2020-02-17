var ADependencies = [ "sap/secmon/ui/commons/UIUtils", "sap/secmon/ui/commons/Formatter" ];

sap.ui.define(ADependencies, function(UIUtils, Formatter) {
    "use strict";
    sap.secmon.ui.commons.AlertTriggerFormatter = {
        uiUtils : UIUtils,
        /**
         * returns a short trigger text (without triggering object)
         * 
         * @param patternType:
         *            ANOMALY or blank
         * @param scoreFunction:
         *            optional: MIN, MAX, or AVG
         */
        alertTriggerShortFormatter : function(patternType, scoreFunction, countInput, thresholdInput, textInput) {
            var oControl = this;
            var oContext = this.getBindingContext();
            if (oContext === undefined || oContext === null) {
                return "";
            }
            var count = countInput || oContext.getProperty("Count");
            var threshold = thresholdInput || oContext.getProperty("Threshold");
            var text = textInput || oContext.getProperty("Text");
            if (threshold === undefined || threshold === null) {
                threshold = sap.secmon.ui.commons.AlertTriggerFormatter.getThresholdFromAlertText(text);
            }

            var getCommonText = function(sKey) {
                var oView = UIUtils.getView(oControl);
                if (oView === null || oView === undefined) {
                    return sKey;
                }
                return oView.getController().getCommonText(sKey);
            };

            // PEF_alertText1=Measure {0} exceeds threshold {1}
            // PEF_alertText3=Measure {0} reaches the threshold {1}
            // PEF_anomalyAlShortText = Anomaly with score {0} occurred

            if (patternType === "ANOMALY") {
                switch (scoreFunction) {
                case "MIN":
                    text = getCommonText("PEF_minAlShortText");
                    break;
                case "MAX":
                    text = getCommonText("PEF_maxAlShortText");
                    break;
                case "AVG":
                    text = getCommonText("PEF_avgAlShortText");
                    break;
                default:
                    text = getCommonText("PEF_anomalyAlShortText");
                }
            } else {
                text = (count === threshold) ? getCommonText("PEF_alertText3") : getCommonText("PEF_alertText1");
            }
            text = text.replace("{0}", count);
            text = text.replace("{1}", threshold);
            return text;
        },

        /*-
         * Formatter for creating the alert message
         * Text field is bound against relation Details
         * aDetailPaths: array containing paths of Alert details.
         * Example: ["Details(DetailId=X'E71D8BC43F0D5A4E99A96693AEF5CD46',AlertId.AlertId=X'49D1E9928831774CB6E4CCD919031916')"]
         */
        alertTriggerFormatter : function(aDetailPaths, patternType, countInput, thresholdInput, textInput) {
            if (aDetailPaths === undefined || aDetailPaths === null) {
                return "";
            }
            var oControl = this;
            var oContext = this.getBindingContext();
            if (oContext === undefined || oContext === null) {
                return "";
            }
            var count = countInput || oContext.getProperty("Count");
            var threshold = thresholdInput || oContext.getProperty("Threshold");
            var text = textInput || oContext.getProperty("Text");
            if (threshold === undefined || threshold === null) {
                threshold = sap.secmon.ui.commons.AlertTriggerFormatter.getThresholdFromAlertText(text);
            }
            var oModel = oContext.getModel();
            var i, oDetail;
            var aDetails = [];
            for (i = 0; i < aDetailPaths.length; i++) {
                oDetail = oModel.getObject("/" + aDetailPaths[i]);
                aDetails.push(oDetail);
            }

            var getCommonText = function(sKey) {
                var oView = UIUtils.getView(oControl);
                if (oView === null || oView === undefined) {
                    return sKey;
                }
                return oView.getController().getCommonText(sKey);
            };

            return sap.secmon.ui.commons.AlertTriggerFormatter.createAlertText.call(this, getCommonText, count, threshold, aDetails, patternType);
        },

        createAlertText : function(fnGetCommonText, count, threshold, aDetails, patternType) {
            // PEF_alertText1=Measure {0} exceeds threshold {1}
            // PEF_alertText2=For {2} = {3} measure {0} exceeds threshold {1}
            // PEF_alertText3=Measure {0} reaches the threshold {1}
            // PEF_alertText4=For {2} = {3} measure {0} reaches threshold{1}
            // PEF_anomalyAlShortText = Anomaly Score Is {0}
            // occurred
            var TEMPLATE_WITHOUT_DIMENSION = fnGetCommonText("PEF_alertText1");
            var TEMPLATE_WITH_DIMENSION = fnGetCommonText("PEF_alertText2");
            if (count === threshold) {
                TEMPLATE_WITHOUT_DIMENSION = fnGetCommonText("PEF_alertText3");
                TEMPLATE_WITH_DIMENSION = fnGetCommonText("PEF_alertText4");
            } else if (count < threshold) {
                TEMPLATE_WITHOUT_DIMENSION = fnGetCommonText("PEF_alertText5");
                TEMPLATE_WITH_DIMENSION = fnGetCommonText("PEF_alertText6");
            }

            var text;
            var dimsAndValues;

            // Prepare the text
            if (aDetails.length === 0) {
                text = TEMPLATE_WITHOUT_DIMENSION;
            } else {
                text = TEMPLATE_WITH_DIMENSION;
            }
            if (patternType === "ANOMALY") {
                if (aDetails.length === 0) {
                    text = fnGetCommonText("PEF_anomalyAlShortText");
                } else {
                    text = fnGetCommonText("PEF_anomalyAlertText");
                }
            }
            var dimensionSeparator;
            text = text.replace("{0}", count);
            text = text.replace("{1}", threshold);
            // Put parenthesis around the names and values only
            // if there are multiple dimensions. (real tuples)
            if (aDetails.length > 1) {

                dimsAndValues = "(";
            } else {
                dimsAndValues = "";
            }
            // No separator in front of the first entry:
            dimensionSeparator = "";

            for (var j = 0; j < aDetails.length; j++) {
                dimsAndValues += dimensionSeparator + "'" + Formatter.knowledgebaseFormatter.call(this, aDetails[j].DisplayKey, aDetails[j].Name) + "'" + " = " + "'" + aDetails[j].Value + "'";
                dimensionSeparator = " / ";
            }
            if (aDetails.length > 1) {
                dimsAndValues += ")";
            }

            text = text.replace("{2}", dimsAndValues);
            return text;
        },

        getThresholdFromAlertText : function(sText) {
            var sResult = "<unknown threshold>";
            if (sText === undefined || sText === null) {
                return sResult;
            }
            var aParts = sText.split(" ");
            var i;
            for (i = 0; i < aParts.length - 1; i++) {
                if (aParts[i] === "threshold") {
                    return aParts[i + 1];
                }
            }
            return sResult;
        }

    };
    return sap.secmon.ui.commons.AlertTriggerFormatter;
});
