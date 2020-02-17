jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.secmon.ui.loglearning.Constants");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.declare("sap.secmon.ui.loglearning.util.Formatter");

/**
 * Make some formatters globally available.
 */
sap.secmon.ui.loglearning.util.Formatter = {

    KEY_PREFIX : "Key:",
    POSITION_PREFIX : "Position:",

    RUN_STATUS : {
        OPEN : "Open",
        READ : "Read",
        RUNNING : "Running",
        SUCCESSFUL : "Successful",
        ERROR : "Error"
    },

    oCommons : new sap.secmon.ui.commons.CommonFunctions(),

    displayNameFormatter : function(displayName, nameSpace) {
        if (nameSpace && nameSpace.length > 0) {
            return displayName + " (" + nameSpace + ")";
        } else {
            return displayName;
        }

    },

    nameDescriptionFormatter : function(name, description) {
        if (name && name.length > 0 && description && description.length > 0) {
            return description + " (" + name + ")";
        }
        if (!name || name.length === 0) {
            return description;
        } else {
            return name;
        }
    },

    markupChangedTooltip : function(sOriginalMarkup, sMarkup) {

        var i18nModel = this.getModel("i18n");
        if (i18nModel === undefined) {
            if (sOriginalMarkup === sMarkup || !sOriginalMarkup) {
                return '';
            } else {
                return "'" + sOriginalMarkup + "' != '" + sMarkup + "'";
            }
        } else {
            if (sOriginalMarkup === sMarkup) {
                return sap.secmon.ui.commons.Formatter.i18nText.call(this, i18nModel.getProperty("Interpret_unchMarkup"));
            } else if (!sOriginalMarkup) {
                return '';
            } else {
                return sap.secmon.ui.commons.Formatter.i18nText.call(this, i18nModel.getProperty("Interpret_chMarkup"), sOriginalMarkup, sMarkup);
            }
        }
    },

    activatableTooltip : function(activationCode) {
        var i18nModel = this.getModel("i18n");
        if (i18nModel !== undefined) {
            switch (activationCode) {
            case 0: // activatable
                return "";
            case 1:
                return i18nModel.getProperty("Interpret_nonAct1");
            case 2:
                return i18nModel.getProperty("Interpret_nonAct2");
            case 3:
                return i18nModel.getProperty("Interpret_nonAct3");
            default:
                return "";
            }

        }
    },

    statusFormatter : function(sStatus, durationInMinutes) {

        var i18nModel = this.getModel("i18n");
        if (i18nModel === undefined) {
            return sStatus;
        }

        var formattedMinutes = durationInMinutes ? parseFloat(durationInMinutes).toFixed() : "0";
        switch (sStatus) {

        case sap.secmon.ui.loglearning.util.Formatter.RUN_STATUS.OPEN: // waiting for SDS to pick up task
            return sap.secmon.ui.commons.Formatter.i18nText.call(this, i18nModel.getProperty("Interpret_WaitSDS"), formattedMinutes);
        case sap.secmon.ui.loglearning.util.Formatter.RUN_STATUS.READ: // waiting for SDS to start processing task
            return sap.secmon.ui.commons.Formatter.i18nText.call(this, i18nModel.getProperty("Interpret_WaitStart"), formattedMinutes);
        case sap.secmon.ui.loglearning.util.Formatter.RUN_STATUS.RUNNING: // task being executed on SDS
            return sap.secmon.ui.commons.Formatter.i18nText.call(this, i18nModel.getProperty("Interpret_Running"), formattedMinutes);
        case sap.secmon.ui.loglearning.util.Formatter.RUN_STATUS.SUCCESSFUL:
            return i18nModel.getProperty("Interpret_Successful");
        case sap.secmon.ui.loglearning.util.Formatter.RUN_STATUS.ERROR:
            return i18nModel.getProperty("Interpret_Error");
        default:
            return i18nModel.getProperty("Interpret_Unknown");
        }
    },

    statusTooltipFormatter : function(sStatus, durationInMinutes) {

        var i18nModel = this.getModel("i18n");
        if (i18nModel === undefined) {
            return sStatus;
        }

        var formattedMinutes = durationInMinutes ? parseFloat(durationInMinutes).toFixed() : "0";
        switch (sStatus) {

        case sap.secmon.ui.loglearning.util.Formatter.RUN_STATUS.OPEN: // waiting for SDS to pick up task
            return sap.secmon.ui.commons.Formatter.i18nText.call(this, i18nModel.getProperty("Interpret_WaitSDSTOL"), formattedMinutes);
        case sap.secmon.ui.loglearning.util.Formatter.RUN_STATUS.READ: // waiting for SDS to start processing task
            return sap.secmon.ui.commons.Formatter.i18nText.call(this, i18nModel.getProperty("Interpret_WaitStartTOL"), formattedMinutes);
        case sap.secmon.ui.loglearning.util.Formatter.RUN_STATUS.RUNNING: // task being executed on SDS
            return sap.secmon.ui.commons.Formatter.i18nText.call(this, i18nModel.getProperty("Interpret_RunningTOL"), formattedMinutes);
        case sap.secmon.ui.loglearning.util.Formatter.RUN_STATUS.SUCCESSFUL:
            return i18nModel.getProperty("Interpret_Successful");
        case sap.secmon.ui.loglearning.util.Formatter.RUN_STATUS.ERROR:
            return i18nModel.getProperty("Interpret_Error");
        default:
            return i18nModel.getProperty("Interpret_Unknown");
        }
    },

    /**
     * Event and logtype come in pairs. Either none is set, or both are set.
     */
    hashValueStateFormatter : function(eventHash, logTypeHash) {
        // '30' seems to represent a null guid
        if (eventHash !== "30" && (!logTypeHash || logTypeHash === "30")) {
            return "Error";
        } else if ((!eventHash || eventHash === "30") && logTypeHash !== "30") {
            return "Error";
        } else {
            return "None";
        }
    },

    /**
     * some values come in pairs
     */
    valueStateFormatter : function(value1, value2) {
        if (value1 && value1.length > 0 && (!value2 || value2.length === 0)) {
            return "Error";
        } else if ((!value1 || value1.length === 0) && value2 && value2.length > 0) {
            return "Error";
        } else {
            return "None";
        }
    },

    /**
     * Caution: The annotations may look like "Key:something" or Position:13". The annotations may be entered as variables in operands for merge operator or regex operator. Example: "?Key:something
     * holds value for variable 'something' whereas ?Position:13 holds value of variable at position 13". Therefore, the "Key:" and "Position:" must not be translated! There must be no blanks
     * inbetween! Also: The RuntimeParser (class com.sap.etd.adapter.runtimeparser.processing.extraction.ValueMappingHandler, method "getValueBySource") is hard-coded to look for strings "Key:" and
     * "Position:"!
     */
    annotationText : function(sType, sFixedValue) {
        if (sFixedValue && sFixedValue !== "" && sType === "KeyValue.Key") {
            return sap.secmon.ui.loglearning.util.Formatter.KEY_PREFIX + sFixedValue;
        } else if (sFixedValue && sFixedValue !== "" && sType === "StructuredPosition.Position") {
            return sap.secmon.ui.loglearning.util.Formatter.POSITION_PREFIX + sFixedValue;
        } else {
            return sType;
        }
    },

    targetIdTooltipText : function(sName, sNamespace, sType) {
        return sName + " {" + sNamespace + "} - " + sType;
    },

    targetValueText : function(sTargetValue, sEventName) {
        return sEventName || sTargetValue;
    },

    targetValueTooltipText : function(sName, sNamespace) {
        if (sName && sNamespace) {
            return sName + " {" + sNamespace + "}";
        } else {
            var i18nModel = this.getModel("i18n");
            if (i18nModel) {
                return i18nModel.getProperty("Interpret_TargetValueTOL");
            }
            return "";
        }
    },

    stagingLogTableTitle : function(utc, insertTimestamp) {
        var i18nModel = this.getModel("i18n");
        if (i18nModel === undefined) {
            return insertTimestamp;
        }

        var formattedDate = insertTimestamp ? sap.secmon.ui.commons.Formatter.dateFormatterEx(utc, insertTimestamp) : i18nModel.getProperty("Interpret_Unknown");
        return sap.secmon.ui.commons.Formatter.i18nText.call(this, i18nModel.getProperty("Interpret_TestResFrom"), formattedDate);

    },

    formatConstantValue : function(sGroupHash) {
        if (sGroupHash && sGroupHash.length > 0) {
            return false;
        }
        return true;
    },

    formatCommandTypeESP2UI : function(sCommandType) {
        var i18nModel = this.getModel("i18n");
        if (!i18nModel) {
            return sCommandType;
        }
        switch (sCommandType) {
        case "Staging":
            return i18nModel.getProperty("Interpret_Discovery");
        case "KeyGeneration":
            return i18nModel.getProperty("Interpret_Activation");
        case "Test":
            return i18nModel.getProperty("Interpret_Testing");
        case "UpdateRTRules":
            return i18nModel.getProperty("Interpret_Synchronization");
        default:
            return i18nModel.getProperty("Interpret_Unknown");
        }
    },

    formatStatusESP2UI : function(sStatus) {
        var i18nModel = this.getModel("i18n");
        if (!i18nModel) {
            return sStatus;
        }
        switch (sStatus) {
        case "Read":
            return i18nModel.getProperty("Interpret_InProcess");
        case "Open":
            return i18nModel.getProperty("Interpret_Open");
        case "Error":
            return i18nModel.getProperty("Interpret_Error");
        case "Successful":
            return i18nModel.getProperty("Interpret_Successful");
        default:
            return i18nModel.getProperty("Interpret_Unknown");
        }
    },

    formatRuleStatusESP2UI : function(sStatus) {
        var i18nModel = this.getModel("i18n");
        if (!i18nModel) {
            return sStatus;
        }
        switch (sStatus) {
        case "InSync":
            return i18nModel.getProperty("Interpret_InSync");
        case "OutOfSync":
            return i18nModel.getProperty("Interpret_OutOfSync");
        case "NotExisting":
            return i18nModel.getProperty("Interpret_NotExist");
        default:
            return i18nModel.getProperty("Interpret_Unknown");
        }
    },

    /**
     * parses the input string and retrieves the log layout
     */
    logLayout : function(sLogLayoutCode) {

        var i18nModel = this.getModel("i18n");
        if (i18nModel === undefined) {
            return sLogLayoutCode;
        }

        // the log layout is encoded in a format like: "KV;:;%3B%3B", "ST;:", or "TX"
        if (sLogLayoutCode && sLogLayoutCode.length > 1) {
            switch (sLogLayoutCode.substring(0, 2)) {
            case 'TX':
                return i18nModel.getProperty("Interpret_FreeText");
            case 'KV':
                return i18nModel.getProperty("Interpret_KeyValue");
            case 'ST':
                return i18nModel.getProperty("Interpret_Structured");
            default:
                return null;
            }
        } else {
            return null;
        }
    },

    /**
     * returns true if the string contains info on key-value log layout
     */
    isKVLogLayout : function(sLogLayoutCode) {
        // the log layout and its separators are encoded in a format like: "KV;:;%3B%3B", "ST;:", or "TX"
        if (sLogLayoutCode && sLogLayoutCode.length > 1) {
            return (sLogLayoutCode.substring(0, 2) === 'KV');
        } else {
            return false;
        }
    },

    /**
     * returns true if the string contains info on structured list log layout
     */
    isSTLogLayout : function(sLogLayoutCode) {
        // the log layout and its separators are encoded in a format like: "KV;:;%3B%3B", "ST;:", or "TX"
        if (sLogLayoutCode && sLogLayoutCode.length > 1) {
            return (sLogLayoutCode.substring(0, 2) === 'ST');
        } else {
            return false;
        }
    },

    /**
     * parses the input string and retrieves the key-value separator
     */
    kvSeparator : function(sLogLayoutCode) {
        // the log layout and its separators are encoded in a format like: "KV;:;%3B%3B", "ST;:", or "TX"
        if (sLogLayoutCode && sLogLayoutCode.length > 1 && sLogLayoutCode.substring(0, 2) === 'KV') {
            var aParts = sLogLayoutCode.split(';', 2);
            if (aParts.length > 1) {
                return decodeURIComponent(aParts[1]);
            } else {
                return null;
            }
        } else {
            return null;
        }
    },

    /**
     * parses the input string and retrieves the key-value-pairs separator
     */
    kvpSeparator : function(sLogLayoutCode) {
        // the log layout and its separators are encoded in a format like: "KV;:;%3B%3B", "ST;:", or "TX"
        if (sLogLayoutCode && sLogLayoutCode.length > 1 && sLogLayoutCode.substring(0, 2) === 'KV') {
            var aParts = sLogLayoutCode.split(';', 3);
            if (aParts.length > 2) {
                return decodeURIComponent(aParts[2]);
            } else {
                return null;
            }
        } else {
            return null;
        }
    },

    /**
     * parses the input string and retrieves the separator of a structured list
     */
    listSeparator : function(sLogLayoutCode) {
        // the log layout and its separators are encoded in a format like: "KV;:;%3B%3B", "ST;:", or "TX"
        if (sLogLayoutCode && sLogLayoutCode.length > 2 && sLogLayoutCode.substring(0, 2) === 'ST') {
            return decodeURIComponent(sLogLayoutCode.substring(3));
        } else {
            return null;
        }
    },

    attributeTooltip : function(aAttributes) {
        if (!aAttributes || aAttributes.length === 0) {
            return "";
        }
        return aAttributes.map(function(oAttribute) {
            return oAttribute.name + " (" + oAttribute.nameSpace + ") - " + oAttribute.dataType;
        }).join(", ");
    },

    containsHash : function(container, rawHash) {
        if (!container || !rawHash) {
            return false;
        }
        var hashHex = sap.secmon.ui.loglearning.util.Formatter.oCommons.base64ToHex(rawHash);
        return container.indexOf(hashHex) !== -1;
    },

    eventTypeLinkTextFormatter : function(bIsProductiveRule, sEntryTypeId, sStagingRuleRunName, sCurrentRunName, sExtractedLogEntryType) {
        var i18nModel = this.getModel("i18n");
        if (i18nModel === undefined) {
            return bIsProductiveRule;
        }

        if (sEntryTypeId === "<No Match>") {
            return i18nModel.getProperty("Interpret_NoMatch");
        } else if (bIsProductiveRule === "true") {
            return i18nModel.getProperty("Interpret_MatchProdRule");
        } else if (sStagingRuleRunName !== sCurrentRunName) {
            if (sExtractedLogEntryType === '<MATCHING_MARKUP>') {
                return i18nModel.getProperty("Interpret_PMatchDiffRun");
            } else {
                return i18nModel.getProperty("Interpret_MatchDiffRun");
            }
        } else {
            return i18nModel.getProperty("Interpret_MatchCurrRun");
        }
    },

    eventTypeLinksFormatter : function(bIsProductiveRule, sEntryTypeId, sRuleRunName, sCurrentRunName, sExtractedLogEntryType) {
        if (bIsProductiveRule === "true") {
            return [];
        } else if (sRuleRunName) {
            if (sRuleRunName !== sCurrentRunName) {
                return [ {
                    Text : sEntryTypeId,
                    Url : sap.secmon.ui.m.commons.NavigationService.logLearningRunURL.call(this, sRuleRunName, sEntryTypeId)
                }, {
                    Text : sRuleRunName,
                    Url : sap.secmon.ui.m.commons.NavigationService.logLearningRunURL.call(this, sRuleRunName)
                } ];
            }
            if (sEntryTypeId) {
                return [ {
                    Text : sEntryTypeId,
                    Url : sap.secmon.ui.m.commons.NavigationService.logLearningRunURL.call(this, sRuleRunName, sEntryTypeId)
                } ];
            } else {
                return [ {
                    Text : sRuleRunName,
                    Url : sap.secmon.ui.m.commons.NavigationService.logLearningRunURL.call(this, sRuleRunName)
                } ];
            }
        } else {
            return [];
        }
    },

    entryTypeLink : function(id) {
        if (!id) {
            return null;
        }
        var context = this.getBindingContext();
        if (!context) {
            return null;
        }
        var path = context.getPath();
        if (!path) {
            return null;
        }
        var index = path.split("/")[3];
        return parseInt(index) + 1;
    },

    annotationNodeText : function(text, type, mappingRule, conditionPrio) {
        switch (type) {
        case 'PRIORITY':
            return text + ' ' + conditionPrio;
        case 'RULE':
            return text + ' ' + mappingRule;
        default:
            return text;
        }
    },

    /**
     * Downgrade the RegEx by replacing named groups with unnamed groups, replacing atomic groups with groups, and removing lookbehind conditions. This is necessary because the RegEx is executed on
     * Java (in SDS) but validated in Javascript (in browser). The Regex version of Javascript has fewer features than the RegEx version of Java. Double-maintenance: In backend Javascript code, the
     * same functionality exists in sap/secmon/loginterpretation/util/Util.xsjslib.
     */
    downgradeRegex : function(regex) {
        // Convert named group into unnamed group: Convert (?<name>regex) into (regex)
        var downgradedRegex = regex.replace(/\?<\w+>/g, "");
        // Remove (negative&positive) lookbehind: Remove (?<=text>) and (?<!text)
        downgradedRegex = downgradedRegex.replace(/\(\?<[!=]\S+?\)/g, "");
        // Convert atomic group into group: Convert (?>regex) into (regex)
        downgradedRegex = downgradedRegex.replace(/\(\?\>(\S+?)\)/g, function(match, p1) {
            return '(' + p1 + ')';
        });
        return downgradedRegex;
    },

    /**
     * Annotation can be changed: Type, pattern (for type "Timestamp"), and value (for type "Word") can be changed
     */
    annotationEditable : function(type) {
        return type !== sap.secmon.ui.loglearning.Constants.ANNOTATION_TYPES.BLANK_OR_PUNCTUATION && type !== 'KeyValue.List' && type !== 'StructuredList' && type !== 'JSON';
    },

    /**
     * Annotation can be reset. Pre-Conditions: It was changeable in the first place, and it has not been created manually (i.e. there are original values for type, pattern, and value).
     */
    annotationResettable : function(type, originalType, fixedValue, originalFixedValue) {
        var bEditable = sap.secmon.ui.loglearning.util.Formatter.annotationEditable(type);
        if (!bEditable) {
            return false;
        }
        // the annotation has been created manually
        if (!originalType) {
            return false;
        }
        if (type !== originalType) {
            return true;
        }
        return type === sap.secmon.ui.loglearning.Constants.ANNOTATION_TYPES.WORD && fixedValue !== originalFixedValue;
    }

};
