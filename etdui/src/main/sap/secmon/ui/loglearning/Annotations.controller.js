jQuery.sap.require("sap.secmon.ui.loglearning.util.AnnotationsListConverter");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.loglearning.Annotations", {

    Constants : sap.secmon.ui.loglearning.Constants,
    AnnotationsListConverter : sap.secmon.ui.loglearning.util.AnnotationsListConverter,

    onInit : function() {

        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();

        var oRouter = this.getRouter();
        if (oRouter) {
            oRouter.getRoute("entryTypeDetails").attachMatched(this.onRouteMatched, this);
        }

        this.uiModel = new sap.ui.model.json.JSONModel({
            originalRecordsCount : 0,
            annotationsCount : 0,
            availableAnnotations : this.Constants.AVAILABLE_ANNOTATIONS,
            isAnyIdentifyingKeyPossible : false
        });
        this.getView().setModel(this.uiModel, "uiModel");
    },

    onRouteMatched : function(oEvent) {

        var args = oEvent.getParameter("arguments");
        if (args === null || args === undefined) {
            return;
        }

        var sRunName = args.run;
        var sEntryTypeId = args.entryType;
        if (!sRunName || !sEntryTypeId) {
            return;
        }

        var annotationsTable = this.getView().byId("tableRoleEntityAttrAssign");
        var oBinding = annotationsTable.getBinding("rows");
        var leafAnnotationsfilter = sap.secmon.ui.loglearning.util.AnnotationsListConverter.createFilterOfLeafAnnotations(sEntryTypeId);

        function setKeyVisible(uiModel) {
            var oData = oBinding.getModel().getData();
            if (oData && oData.entryTypes) {
                var annoData = oData.entryTypes.allAnnotations;
                uiModel.setProperty("/isAnyIdentifyingKeyPossible", annoData.some(function(oAnnotation) {
                    return oAnnotation["EntryTypeId.Id"] === sEntryTypeId && oAnnotation.IsIdentifyingKeyPossible === 'true';
                }));
            }
        }

        // Do it several times, just to be sure that filter and flag are always set on different navigation paths
        oBinding.filter(leafAnnotationsfilter);
        setKeyVisible(this.uiModel);
        oBinding.attachChange(function(oEvent) {
            if (oEvent.getParameter("reason") !== "filter") {
                oBinding.filter(leafAnnotationsfilter);
            }
            setKeyVisible(this.uiModel);
        }, this);
        oBinding.attachDataReceived(function(oEvent) {
            oBinding.filter(leafAnnotationsfilter);
            setKeyVisible(this.uiModel);
        }, this);
        oBinding.refresh(true);
    },

    onBeforeRendering : function(oEvent) {

        var origRecordsTable = this.getView().byId("tableOriginalRecords");
        if (!origRecordsTable) {
            return;
        }
        var oRecBinding = origRecordsTable.getBinding("rows");
        oRecBinding.attachDataReceived(function() {
            this.uiModel.setProperty("/originalRecordsCount", oRecBinding.getLength());
        }, this);

        var annotationsTable = this.getView().byId("tableRoleEntityAttrAssign");
        if (!annotationsTable) {
            return;
        }
        var aBinding = annotationsTable.getBinding("rows");

        aBinding.attachDataReceived(function() {
            this.uiModel.setProperty("/annotationsCount", aBinding.getLength());
        }, this);
    },

    onChangeAnnotationType : function(oEvent) {
        // we need to call AnnotationsListConverter._recalculatePositions so that the annotation numbers are recalculated
        var sTimestampType = this.Constants.ANNOTATION_TYPES.TIMESTAMP;

        var oRunJsonModel = this.getView().getModel();
        // get binding context of selected annotation in annotation table
        var oBindingContext = oEvent.getSource().getParent().getBindingContext();
        var oModel = oBindingContext.getModel();

        // reset pattern to default
        var sPattern = "";
        var oSource = oEvent.getSource();
        var sType = oSource.getSelectedKey();
        var sOriginalType = oBindingContext.getProperty("OriginalType");
        if (sType === sTimestampType) {
            if (sOriginalType === sTimestampType) {
                sPattern = oBindingContext.getProperty("OriginalPattern");
            } else {
                sPattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX";
            }
        }
        oModel.setProperty("Pattern", sPattern, oBindingContext);
        oModel.setProperty("Type", sType, oBindingContext);

        // recalculate positions and annotation numbers
        var aAnnotations = oRunJsonModel.getProperty("/entryTypes/allAnnotations");
        var aChangedAnnotations = sap.secmon.ui.loglearning.util.AnnotationsListConverter._recalculatePositions(aAnnotations);
        oRunJsonModel.setProperty("/entryTypes/allAnnotations", aChangedAnnotations);

        // we need to trigger a change event even though the length of annotations has not changed.
        oRunJsonModel.refresh(true);
        this._setSaveNeeded(true);
    },

    /**
     * Handles the press event of the annotation link
     */
    onPressAnnotationLink : function(oEvent) {
        var oBindingContext = oEvent.getSource().getBindingContext();
        new sap.secmon.ui.loglearning.Helper()._ShowDistinctValues(this, oBindingContext);
    },

    /**
     * F4 for attribute
     * 
     * @param oEvent
     */
    onValueHelpAttribute : function(oEvent) {

        var that = this;

        var inputField = oEvent.getSource();
        var oTargetContext = inputField.getBindingContext();
        var boundData = oTargetContext.getObject();
        var searchString = inputField.getValue();

        // allow multi-selection in valuehelp
        var promise = new sap.secmon.ui.loglearning.Helper().openValueHelpEventAttribute(this, boundData, searchString, boundData.AttrHashList, true);

        // in case of multi-selection, the values are concatenated with separator '|'
        $.when(promise).then(function(aSelectedSourceContexts, bConfirmed) {
            if (bConfirmed === false) {
                // user canceled selection
                return;
            }

            that.copyAttributeIds(aSelectedSourceContexts, oTargetContext);
            that._setSaveNeeded(true);

            inputField.setValueState(sap.ui.core.ValueState.None);
            inputField.setValueStateText(null);
            inputField.setValue("");
        });
    },

    onSuggestAttribute : function(oEvent) {
        var sTerm = oEvent.getParameter("suggestValue");
        var aFilters = [];
        if (sTerm) {
            aFilters.push(new sap.ui.model.Filter("attrDisplayName", sap.ui.model.FilterOperator.StartsWith, sTerm));
        }
        var binding = oEvent.getSource().getBinding("suggestionItems");
        binding.filter(aFilters);
    },

    onLiveChangeAttrTextField : function(oEvent) {
        oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
    },

    onAttributeSugggestionSelected : function(oEvent) {
        var inputField = oEvent.getSource();

        // selected row of suggestionItems
        var selectedSuggestionItem = oEvent.getParameter("selectedItem");
        var oSourceContext = selectedSuggestionItem.getBindingContext();
        var oTargetContext = inputField.getBindingContext();

        this.copyAttributeIds([ oSourceContext ], oTargetContext);
        this._setSaveNeeded(true);

        inputField.setValueState(sap.ui.core.ValueState.None);
        inputField.setValueStateText(null);
        inputField.setValue("");
    },

    onDeleteToken : function(oEvent) {
        if (oEvent.getParameter("type") === 'removed') {
            var token = oEvent.getParameter("token");
            var oTokenIdHex = token.getBindingContext().getProperty("hashHex");
            var multiInput = oEvent.getSource();
            var oBindingContext = multiInput.getBindingContext();
            var aAttributeIds = oBindingContext.getProperty("TargetAttributeIds");
            var aFilteredAttributeIds = aAttributeIds.filter(function(oAttributeId) {
                return oAttributeId.hashHex !== oTokenIdHex;
            });
            var sAttrHashList = "";
            if (aFilteredAttributeIds.length > 0) {
                sAttrHashList = aFilteredAttributeIds.map(function(oAttributeId) {
                    return oAttributeId.hashHex;
                }).join('|');

            }
            oBindingContext.getModel().setProperty("TargetAttributeIds", aFilteredAttributeIds, oBindingContext);
            oBindingContext.getModel().setProperty("AttrHashList", sAttrHashList, oBindingContext);

            this._setSaveNeeded(true);
        }
    },

    /**
     * Handles the change event of the pattern input field
     * 
     * @param oEvent
     */
    onChangePattern : function(oEvent) {
        // we need to call AnnotationsListConverter._recalculatePositions so that the annotation numbers are recalculated

        // var oRunJsonModel = this.getView().getModel();
        // var aAnnotations = oRunJsonModel.getProperty("/entryTypes/allAnnotations");
        // var aChangedAnnotations = sap.secmon.ui.loglearning.util.AnnotationsListConverter._recalculatePositions(aAnnotations);
        // oRunJsonModel.setProperty("/entryTypes/allAnnotations", aChangedAnnotations);

        // we need to trigger a change event even though the length of annotations has not changed.
        // oRunJsonModel.refresh(true);
        this._setSaveNeeded(true);
    },

    /**
     * handler for liveChange event of pattern input (used for timestamps only)
     * 
     * @param oEvent
     */
    validateTimestampPattern : function(oEvent) {
        var input = oEvent.getSource();
        var value = input.getValue();
        // Unix time: U: unix time in seconds, UM: unix time in milliseconds
        var unixTimeFound = value === "U" || value === "UM";
        var isoFormatFound = value === "ISO";
        // Date must be fully specified: 4 digit year, and seconds must be given (fractions of a second are optional)
        var valid =
                value.indexOf("yyyy") !== -1 && value.indexOf("MM") !== -1 && value.indexOf("d") !== -1 && (value.indexOf("H") !== -1 || value.indexOf("h") !== -1) && value.indexOf("mm") !== -1 &&
                        value.indexOf("ss") !== -1;
        if (value.length > 0 && !unixTimeFound && !isoFormatFound && !valid) {
            input.setValueState(sap.ui.core.ValueState.Error);
            input.setValueStateText(this.getText("Interpret_DateFormat"));
        } else {
            input.setValueState(sap.ui.core.ValueState.None);
            input.setValueStateText(null);
        }
    },

    /**
     * Change the identfying key of a keyvalue based log
     * 
     * @param oEvent
     * @returns {Boolean}
     */
    onChangeIdentifyingKey : function(oEvent) {
        var bIsChecked = oEvent.getParameters().selected;
        var oBindingContext = oEvent.getSource().getBindingContext();
        oBindingContext.getModel().setProperty("IsIdentifying", bIsChecked ? "true" : "false", oBindingContext);
        this._setSaveNeeded(true);
    },

    /**
     * copy attribute IDs from several source contexts into one target context. The attribute ID is name and namespace, alternatively, the attribute hash is used (the hash is calculated from name and
     * namespace).
     * 
     * @param oSourceContext
     * @param oTargetContext
     */
    copyAttributeIds : function(aSourceContexts, oTargetContext) {
        // Caution: different names and format for the attribute hash!
        // Source field "attrHash" is concatenated into target field "attrHashList"!
        var sKey, sNamespace = "", sName = "";
        var sAttrHashHex = "";
        var sDisplayName = "";
        var aAttributeIds = [];
        var oController = this;
        $.each(aSourceContexts, function(iIndex, oContext) {
            sKey = oContext.getProperty("attrHash");
            sAttrHashHex += oController.oCommons.base64ToHex(sKey) + "|";
            sName += oContext.getProperty("attrName.name") + " | ";
            sNamespace += oContext.getProperty("attrNameSpace.nameSpace") + " | ";
            sDisplayName += oContext.getProperty("attrDisplayName") + " | ";
            aAttributeIds.push({
                hash : oContext.getProperty("attrHash"),
                hashHex : oController.oCommons.base64ToHex(oContext.getProperty("attrHash")),
                name : oContext.getProperty("attrName.name"),
                nameSpace : oContext.getProperty("attrNameSpace.nameSpace"),
                displayName : oContext.getProperty("attrDisplayName")
            });
        });

        // Remove trailing pipe
        sAttrHashHex = sAttrHashHex.slice(0, -1);
        sName = sName.slice(0, -3);
        sNamespace = sNamespace.slice(0, -3);
        sDisplayName = sDisplayName.slice(0, -3);

        // get binding context path of odata model bound to the
        // event text field

        // TODO: These 4 properties are temporary, they are deleted before persisting (i.e. before sending the POST OData request).
        // Find out where they are used, and then replace them with the object "TargetAttributeIds".
        oTargetContext.getModel().setProperty("AttrHashList", sAttrHashHex, oTargetContext);
        oTargetContext.getModel().setProperty("attrName.name", sName, oTargetContext);
        oTargetContext.getModel().setProperty("attrNameSpace.nameSpace", sNamespace, oTargetContext);
        oTargetContext.getModel().setProperty("attrDisplayName", sDisplayName, oTargetContext);

        oTargetContext.getModel().setProperty("TargetAttributeIds", aAttributeIds, oTargetContext);

        console.debug("Attribute Key Hex: %s", sAttrHashHex);
    },

    /**
     * Sets the save needed flag
     * 
     * @param bSaveNeeded
     */
    _setSaveNeeded : function(bSaveNeeded) {
        sap.ui.getCore().getModel("RunModel").setProperty("/isSaveNeeded", bSaveNeeded);
    },
});
