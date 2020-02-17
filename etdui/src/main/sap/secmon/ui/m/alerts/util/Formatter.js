jQuery.sap.declare("sap.secmon.ui.m.alerts.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.EnumService");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");

/**
 * Make some formatters globally available.
 */
sap.secmon.ui.m.alerts.util.Formatter = {
    ONE_HOUR_IN_MS : 3600000,
    oEnumService : new sap.secmon.ui.commons.EnumService(),

    severityFormatter : function(severity) {
        var enumsModel = this.getModel("enums");
        /*
         * The view (this) is sometimes rendered the first time, before it is included into the view hierarchy. In this case, the model is not yet found. After that, it is rendered again, and
         * everything is fine.
         */
        if (enumsModel === undefined) {
            return severity;
        } else {
            return sap.secmon.ui.m.alerts.util.Formatter.oEnumService.getEnumValue(enumsModel, "/sap.secmon.services.ui.m.alerts/Alert/Severity/", severity);
        }
    },

    statusFormatter : function(status) {
        var enumsModel = this.getModel("enums");
        if (enumsModel === undefined) {
            return status;
        } else {
            return sap.secmon.ui.m.alerts.util.Formatter.oEnumService.getEnumValue(enumsModel, "/sap.secmon.services.ui.m.alerts/Alert/Status/", status);
        }
    },

    createOutputIfFormatter : function(createOutputIf) {
        var enumsModel = this.getModel("enums");
        if (enumsModel === undefined) {
            return createOutputIf;
        } else {
            return sap.secmon.ui.m.alerts.util.Formatter.oEnumService.getEnumValue(enumsModel, "/sap.secmon.services.ui.m.anomaly/AnomalyDetectionPattern/CreateOutputIf/", createOutputIf);
        }
    },

    /**
     * formatter to set property enabled of status select control
     * 
     * @param status
     *            of alert
     * @param investigationId
     *            referenced investigation
     * @param key
     *            key of select option
     * 
     */
    statusSelectRestrictor : function(status, investigationId, key) {
        if (status === "EXCLUDED_EXCEPTION" && key !== "EXCLUDED_EXCEPTION") {
            return false;
        } else if (status !== "EXCLUDED_EXCEPTION" && key === "EXCLUDED_EXCEPTION") {
            return false;
        }

        if (investigationId) {
            if (key !== "INVESTIG_TRIGGERED") {
                // investigation assigned => disabled all status <>
                // INVESTIG_TRIGGERED
                return false;
            }
        } else {
            // no investigation assigned
            if (key === "INVESTIG_TRIGGERED") {
                if (status !== "INVESTIG_TRIGGERED") {
                    // no investigation assigned, status <>
                    // INVESTIG_TRIGGERED, key INVESTIG_TRIGGERED
                    return false;
                }
            }
        }
        return true;
    },

    attackFormatter : function(attack) {
        var enumsModel = this.getModel("enums");
        if (enumsModel === undefined) {
            return attack;
        } else {
            return sap.secmon.ui.m.alerts.util.Formatter.oEnumService.getEnumValue(enumsModel, "/sap.secmon.services.ui.m.alerts/Alert/Attack/", attack);
        }
    },

    alertTitleFormatter : function(val1, val2) {
        return (val1 + " (" + sap.secmon.ui.m.alerts.util.Formatter.severityFormatter.call(this, val2) + ")");
    },

    patternFormatter : function(patternName, patternNameSpace, patternType) {
        var sPatternType;
        if (!patternName || patternName.length === 0) {
            return "";
        }
        if (patternType === "ANOMALY") {
            sPatternType = "-" + " " + this.getModel("i18nCommon").getProperty("AnomalyPattern");
        } else {
            sPatternType = "";
        }

        return patternName + " (" + patternNameSpace + ")" + " " + sPatternType;
    },

    eventSourceFormatter : function(source, textEvent, textAlert, textHealthCheck) {
        switch (source) {
        case "Log":
            return textEvent;
        case "Alert":
            return textAlert;
        case "HealthCheck":
            return textHealthCheck;
        default:
            return source;
        }
    },

    sourceEventsFormatter : function(source, eventText, alertText, healthCheckText) {

        switch (source) {
        case "Log":
            return eventText;
        case "Alert":
            return alertText;
        case "HealthCheck":
            return healthCheckText;
        default:
            return source;
        }
    },

    methodFormatter : function(method) {
        var i18nModel = this.getModel("i18n");
        /*
         * The view (this) is sometimes rendered the first time, before it is included into the view hierarchy. In this case, the model is not yet found. After that, it is rendered again, and
         * everything is fine.
         */
        if (i18nModel === undefined) {
            return method;
        } else
            switch (method) {
            case "BINARY":
                return i18nModel.getProperty("MobAlert_NewOcc");
            default:
                return i18nModel.getProperty("MobAlert_AnomGaussDistr");
            }
    },

    isAnomalyEventTrendLinkFormatter : function(measureValue) {
        if (measureValue !== null) {
            return true;
        }
        return false;
    },

    isTriggeringEventsVisible : function(measureValue) {
        return (measureValue === null) ? false : true;
    },

    /**
     * 
     */
    scoreMeasureValueFormatter : function(aggregationMethod, measureValue, absoluteMinThreshold, absoluteMaxThreshold, binaryScoredCount) {
        var i18nModel = this.getModel("i18n");
        /*
         * The view (this) is sometimes rendered the first time, before it is included into the view hierarchy. In this case, the model is not yet found. After that, it is rendered again, and
         * everything is fine.
         */
        if (i18nModel === undefined) {
            return;
        }
        if (aggregationMethod === 'BINARY' && measureValue === null) {
            return i18nModel.getProperty("MobAlert_ValueNotNew");
        } else if (aggregationMethod !== 'BINARY' && measureValue === null) {
            return i18nModel.getProperty("MobAlert_ValueNoDatapoints");
        } else {

            var bAbsolute = aggregationMethod === 'BINARY';
            // It means that previous measures were 0
            var bValue = (measureValue === "1");
            if (bAbsolute === true && bValue === true) {
                var oData = this.getModel().oData;
                for ( var prop in oData) {
                    if (prop.substring(0, 9) === "Alerts(X'" && prop.substring(41, 43) === "')") {
                        binaryScoredCount = oData[prop].BinaryScoredCount;
                    }

                }
            }

            return sap.secmon.ui.m.alerts.util.Formatter.absoluteOrRelativeFormatter(bAbsolute, bValue, measureValue, absoluteMinThreshold, absoluteMaxThreshold, i18nModel, binaryScoredCount);
        }
    },

    /**
     * monster formatter: It checks if the flag bAbsolute is true. If it is true; According to boolean value bValue the i18b templates sTemplateTrue or sTemplateFalse are returned. If flag bAbsolite
     * is false, three numbers are compared. We check if number1 is within range [number2A, number2B]. The numbers are rounded so that different values are noticable but insignificant decimal places
     * are discarded. The used i18n templates are sTemplateBelow or sTemplateAbove, respectively.
     * 
     */
    absoluteOrRelativeFormatter : function(bAbsolute, bValue, number1, number2A, number2B, i18nModel, binaryScoredCount) {
        if (bAbsolute === true) {
            return bValue === true ? sap.secmon.ui.commons.Formatter.i18nText(i18nModel.getProperty("MobAlert_ValueNew"), binaryScoredCount) : i18nModel.getProperty("MobAlert_ValueNotNew");
        }
        return sap.secmon.ui.m.alerts.util.Formatter.roundedValueListFormatter(number1, number2A, number2B, i18nModel);
    },

    /**
     * the formatter rounds the two number values to 2 significant digits and inserts them into the supplied i18n template. Number1 is compared against number2. The numbers are rounded so that
     * different values are noticable but insignificant decimal places are discarded.
     */
    roundedValuesFormatter : function(number1, number2) {

        var i18nModel = this.getModel("i18n");
        /*
         * The view (this) is sometimes rendered the first time, before it is included into the view hierarchy. In this case, the model is not yet found. After that, it is rendered again, and
         * everything is fine.
         */
        if (i18nModel === undefined) {
            return;
        }
        var DEFAULT_PRECISION = 3;
        if (!number1) {
            return "";
        }
        if (!number2) {
            return "" + number1;
        }
        var number1AsNumber = number1.toFixed ? number1 : parseFloat(number1);
        var number2AsNumber = number2.toFixed ? number2 : parseFloat(number2);

        var num1ExpStr = number1AsNumber.toExponential();
        var num2ExpStr = number2AsNumber.toExponential();
        var orderOfMagnitude1 = num1ExpStr.substr(num1ExpStr.indexOf("e") + 1);
        var orderOfMagnitude2 = num2ExpStr.substr(num2ExpStr.indexOf("e") + 1);
        var orderOfPrecision = DEFAULT_PRECISION;
        if (orderOfMagnitude1 === orderOfMagnitude2) {
            var numDiffExpStr = (number1AsNumber - number2AsNumber).toExponential();
            var orderOfMagnitudeDiff = orderOfMagnitude1 - numDiffExpStr.substr(numDiffExpStr.indexOf("e") + 1);
            orderOfPrecision = Math.max(orderOfPrecision, orderOfMagnitudeDiff);
        }

        var roundedNo1 = sap.secmon.ui.m.alerts.util.Formatter._round(number1AsNumber, orderOfPrecision);
        var roundedNo2 = sap.secmon.ui.m.alerts.util.Formatter._round(number2AsNumber, orderOfPrecision);
        if (number1AsNumber < number2AsNumber) {
            return sap.secmon.ui.commons.Formatter.i18nText(i18nModel.getProperty("MobAlert_ValueWithRange"), roundedNo1, roundedNo2);
        } else {
            return sap.secmon.ui.commons.Formatter.i18nText(i18nModel.getProperty("MobAlert_ValueWithRange"), roundedNo1, roundedNo2);
        }

    },
    /**
     * The formatter shows either the number of triggering events (if they have been calculated) or the measure
     */
    triggeringEventFormatter : function(triggeringEventCount, measureCount) {
        return triggeringEventCount > 0 ? triggeringEventCount : measureCount;
    },

    /**
     * the formatter rounds the last two number values to 2 significant digits (relative to the first number) and inserts them into the supplied i18n template. The first number is not rounded. Number1
     * is compared against number2A and number2B. The numbers are rounded so that different values are noticable but insignificant decimal places are discarded.
     */
    roundedValueListFormatter : function(number1, number2A, number2B, i18nModel) {
        var DEFAULT_PRECISION = 3;
        if (!number1) {
            return "";
        }
        if (!number2A || !number2B) {
            return "" + number1;
        }

        var number1AsNumber = number1.toFixed ? number1 : parseFloat(number1);
        var number2AAsNumber = number2A.toFixed ? number2A : parseFloat(number2A);
        var number2BAsNumber = number2B.toFixed ? number2B : parseFloat(number2B);

        var num1ExpStr = number1AsNumber.toExponential();
        var num2AExpStr = number2AAsNumber.toExponential();
        var num2BExpStr = number2BAsNumber.toExponential();
        var orderOfMagnitude1 = num1ExpStr.substr(num1ExpStr.indexOf("e") + 1);
        var orderOfMagnitude2A = num2AExpStr.substr(num2AExpStr.indexOf("e") + 1);
        var orderOfMagnitude2B = num2BExpStr.substr(num2BExpStr.indexOf("e") + 1);
        var orderOfPrecisionA = DEFAULT_PRECISION;
        var numDiffExpStr, orderOfMagnitudeDiff;
        if (orderOfMagnitude1 === orderOfMagnitude2A) {
            numDiffExpStr = (number1AsNumber - number2AAsNumber).toExponential();
            orderOfMagnitudeDiff = numDiffExpStr.substr(numDiffExpStr.indexOf("e") + 1);
            orderOfPrecisionA = Math.max(DEFAULT_PRECISION, orderOfMagnitude1 - orderOfMagnitudeDiff);
        } else if (orderOfMagnitude2A !== orderOfMagnitude2B) {
            orderOfPrecisionA = DEFAULT_PRECISION;
        }

        var orderOfPrecisionB = DEFAULT_PRECISION;
        if (orderOfMagnitude1 === orderOfMagnitude2B) {
            numDiffExpStr = (number1AsNumber - number2BAsNumber).toExponential();
            orderOfMagnitudeDiff = numDiffExpStr.substr(numDiffExpStr.indexOf("e") + 1);
            orderOfPrecisionB = Math.max(DEFAULT_PRECISION, orderOfMagnitude1 - orderOfMagnitudeDiff);
        } else if (orderOfMagnitude2A !== orderOfMagnitude2B) {
            orderOfPrecisionB = DEFAULT_PRECISION;
        }

        var roundedNo2A = sap.secmon.ui.m.alerts.util.Formatter._round(number2AAsNumber, orderOfPrecisionA);
        var roundedNo2B = sap.secmon.ui.m.alerts.util.Formatter._round(number2BAsNumber, orderOfPrecisionB);
        // var roundedNo1 =
        // sap.secmon.ui.m.alerts.util.Formatter._round(number1AsNumber,
        // Math.max(orderOfPrecisionA, orderOfPrecisionB));
        if (number1AsNumber > number2AAsNumber && number1AsNumber > number2BAsNumber) {
            return sap.secmon.ui.commons.Formatter.i18nText(i18nModel.getProperty("MobAlert_ValueAbove"), number1, roundedNo2A, roundedNo2B);
        } else if (number1AsNumber < number2AAsNumber && number1AsNumber < number2BAsNumber) {
            return sap.secmon.ui.commons.Formatter.i18nText(i18nModel.getProperty("MobAlert_ValueBelow"), number1, roundedNo2A, roundedNo2B);
        } else {
            return sap.secmon.ui.commons.Formatter.i18nText(i18nModel.getProperty("MobAlert_ValueWithin"), number1, roundedNo2A, roundedNo2B);
        }
    },

    textFormatter : function(sValue, sOptionalValue) {
        if (sValue === undefined || sValue === null) {
            return "null";
        }
        if (sOptionalValue && sValue.length > 0) {
            return sValue + " (" + sOptionalValue + ")";
        }
        return sValue.toString();
    },

    /**
     * round a number to given significant digits
     * 
     * @number number to be rounded
     * @places an integer number: count of significant digits
     */
    _round : function(num, places) {
        function cutOffAfterDecimal(num, places) {
            if (places === 0) {
                return Math.round(num);
            }
            return +(Math.round(num + "e+" + (places - 1)) + "e-" + (places - 1));
        }
        var numExpStr = num.toExponential();
        var beforeDecimal = +(numExpStr.substr(0, numExpStr.indexOf("e")));
        var roundedBeforeDecimal = cutOffAfterDecimal(beforeDecimal, places);
        var exp = numExpStr.substr(numExpStr.indexOf("e"));
        return +(roundedBeforeDecimal + exp);
    },

    eventAsLinkFormatter : function(measureContext, patternType) {
        return measureContext === "Log";
    },
    displaySystemsFormatter : function(patternType, measureContext) {
        return (measureContext !== "Alert" && patternType !== 'ANOMALY');
    },

    selectedTab : function(patternType, measureContext) {
        if (patternType === 'ANOMALY') {
            return 'FeatureSet';
        }
        switch (measureContext) {
        case 'Log':
            return 'Systems';
        case 'HealthCheck':
            return 'Investigations';
        default:
            return 'Groups';
        }
    },

    InvestigationButton: function (editMode, bInvestigationWrite) {
        if (editMode) {
            return false;
        }
        return !!bInvestigationWrite && true;
    },

    affectedSystemAsLinkFormatter : function(displayMode, link) {
        if (displayMode === true && typeof link === "string") {
            return true;
        }
        return false;
    },

    floatFormatter : function(float) {
        var oFloat = Math.round(float * 100) / 100;
        return oFloat;
    },

    /**
     * Return the time (in milliseconds) since the start of day denoted by the given Date object. The returned value is always relative to UTC. This ensures that the midnights are equidistant (This is
     * not true for daylight saving).
     */
    startOfDayInUTCMilliseconds : function(oDate) {
        var midnightUTC = new Date(oDate);
        midnightUTC.setUTCHours(0, 0, 0);
        return midnightUTC.getTime();
    },

    /**
     * Return the time (in milliseconds) since the start of day denoted by the given Date object. The returned value is relative to local time.
     */
    startOfDayInLocalMilliseconds : function(oDate) {
        var midnightLocal = new Date(oDate);
        midnightLocal.setHours(0, 0, 0);
        return midnightLocal.getTime();
    },

    commentIconFormatter : function(commentType) {
        switch (commentType) {
        case 'COMMENT':
            return "sap-icon://notes";
        default:
            return "sap-icon://hint";
        }
    },

    commentTitleFormatter : function(commentType, commentText, changedText) {
        switch (commentType) {
        case 'COMMENT':
            return commentText;
        case 'CHANGE':
            return changedText;
        default:
            return commentType;
        }
    },
    
    patternVersionFormatter : function(version) {
        if (version === 0) {
            var i18nModel = this.getModel("i18n");
            if (!i18nModel) {
                return null;
            }
            return i18nModel.getProperty("MobAlert_Unknown");
        }
        return version;
    }

};
