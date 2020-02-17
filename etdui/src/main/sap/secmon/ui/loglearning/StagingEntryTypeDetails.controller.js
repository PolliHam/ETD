$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.secmon.ui.loglearning.Constants");
$.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.loglearning.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.loglearning.util.AnnotationsListConverter");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.loglearning.StagingEntryTypeDetails", {

    Constants : sap.secmon.ui.loglearning.Constants,
    AnnotationsListConverter : sap.secmon.ui.loglearning.util.AnnotationsListConverter,

    onInit : function() {

        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        var oRouter = this.getRouter();
        if (oRouter) {
            oRouter.attachRoutePatternMatched(this.onRouteMatched, this);
        }

        // set model for entry type index
        this.uiModel = new sap.ui.model.json.JSONModel({
            entryTypeIndex : 0,
            entryTypeId : "",
            runName : ""
        });
        this.getView().setModel(this.uiModel, "uiModel");

        var runJsonModel = sap.ui.getCore().getModel("RunJSONModel");
        var annotationsBinding = runJsonModel.bindList("/entryTypes/allAnnotations");

        annotationsBinding.attachChange(function(oEvent) {
            this.syncMarkup();
        }, this);
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
        // The model is supplied by stagingEntryTypes controller.
        // It will send out another routeMatched event after the model has been prepared
        var model = this.getView().getModel();
        if (!model) {
            return;
        }

        var runData = model.getData();
        var that = this;
        if (!runData || Object.keys(runData).length === 0) {
            model.attachRequestCompleted(function() {
                that._setEntryType(sRunName, sEntryTypeId);
            });
        } else {
            this._setEntryType(sRunName, sEntryTypeId);
        }

    },

    onPressToken : function(oEvent) {

        var oControl = oEvent.getSource();
        var oBindingContext = oEvent.getSource().getBindingContext();
        var oParentBindingContext = oEvent.getSource().getParent().getBindingContext();

        if (!this._menu) {
            this._menu = sap.ui.xmlfragment("sap.secmon.ui.loglearning.tokenMenu", this);
            this.getView().addDependent(this._menu);
            var oMenuModel = new sap.ui.model.json.JSONModel({
                markupBindingContext : null,
                bindingContext : null,
                selectedType : null,
                valueAnnotation : null,
                id : null,
                pattern : null,
                availableAnnotations : this.Constants.AVAILABLE_ANNOTATIONS,
                editable : false,
                resettable : false
            });
            this._menu.setModel(oMenuModel);
        }

        var sType = oBindingContext.getProperty("Type");
        var sOriginalType = oBindingContext.getProperty("OriginalType");
        var sFixedValue = oBindingContext.getProperty("FixedValue");
        var sOriginalFixedValue = oBindingContext.getProperty("OriginalFixedValue");
        var annotationId = oBindingContext.getProperty("Id");

        var model = this._menu.getModel();
        model.setProperty("/markupBindingContext", oParentBindingContext);
        model.setProperty("/bindingContext", oBindingContext);
        model.setProperty("/selectedType", sType);
        model.setProperty("/valueAnnotation", sFixedValue);
        model.setProperty("/id", annotationId);
        model.setProperty("/pattern", oBindingContext.getProperty("Pattern"));
        model.setProperty("/editable", sap.secmon.ui.loglearning.util.Formatter.annotationEditable(sType));
        model.setProperty("/resettable", sap.secmon.ui.loglearning.util.Formatter.annotationResettable(sType, sOriginalType, sFixedValue, sOriginalFixedValue));

        var eDock = sap.ui.core.Popup.Dock;
        this._menu.open(true, oControl, eDock.BeginTop, eDock.BeginBottom, oControl);
    },

    onInsertAnnotation : function(oEvent) {
        var sTimestampType = this.Constants.ANNOTATION_TYPES.TIMESTAMP, sWordType = this.Constants.ANNOTATION_TYPES.WORD;

        var oRunJsonModel = this.getView().getModel();
        var sValue;
        var oMenuItem = oEvent.getParameter("item");
        var oMenuModel = oEvent.getSource().getModel();
        var oMarkupBindingContext = oMenuModel.getProperty("/markupBindingContext");
        var oBindingContext = oMenuModel.getProperty("/bindingContext");
        var sType = oMenuItem.data("key");
        var sPosition = oEvent.getSource().getParent().data("position");
        var oModel = oBindingContext.getModel();

        var sReferenceTokenKey = oBindingContext.getProperty("Id");

        if (sType === sWordType || sType === sTimestampType) {

            sValue = oMenuItem.getValue();
            sValue = sValue.replace(/[\s]/g, '');
            if (!sValue) {
                return;
            }
        }

        var aAnnotations = oModel.getProperty("/entryTypes/allAnnotations");
        var oSelectedAnnotation;
        aAnnotations.forEach(function(oAnnotation) {
            if (oAnnotation.Id === sReferenceTokenKey) {
                oSelectedAnnotation = oAnnotation;
            }
        });

        var oNewAnnotation = {
            "AttrHash" : null,
            "AttrHashList" : "30",
            Attributes : [ {
                "attrName.name" : "",
                "attrNameSpace.nameSpace" : "",
                "attrDisplayName" : ""
            } ],
            "EntryTypeId.Id" : oMarkupBindingContext.getProperty("Id"),
            "FixedValue" : sType === sWordType ? sValue : "",
            "Id" : sap.secmon.ui.browse.utils.generateGUID(),
            "IsIdentifying" : "false",
            "IsIdentifyingKeyPossible" : "false",
            "ParentAnnotation" : null,
            "Pattern" : sType === sTimestampType ? sValue : "",
            "RegexGroupName" : "",
            "RunName" : oMarkupBindingContext.getProperty("RunName"),
            "Type" : sType,
            Action : "CREATE"
        };

        var bPositionAfter = (sPosition !== this.Constants.ANNOTATION_POSITION.BEFORE);
        var annoCountBefore = aAnnotations.length;
        var aNewAnnotations = sap.secmon.ui.loglearning.util.AnnotationsListConverter.insertAnnotation(aAnnotations, oNewAnnotation, oSelectedAnnotation, bPositionAfter);
        var annoCountAfter = aNewAnnotations.length;
        oRunJsonModel.setProperty("/entryTypes/allAnnotations", aNewAnnotations);

        // we need to trigger an explicit change event when the length of annotations has not changed due to a merge
        oRunJsonModel.refresh(annoCountBefore === annoCountAfter);
        this._setSaveNeeded(true);
    },

    /**
     * after a change of annotations, the markup needs to be recalculated, it needs to be stored in field "Markup" of EntryType.
     */
    syncMarkup : function() {

        var oRunJsonModel = this.getView().getModel();
        if (!oRunJsonModel) {
            return;
        }
        var aAnnotations = oRunJsonModel.getProperty("/entryTypes/allAnnotations");
        var sEntryTypeId = this.uiModel.getProperty("/entryTypeId");
        if (!sEntryTypeId || sEntryTypeId === "") {
            return;
        }

        var aFilteredAnnotations = aAnnotations.filter(function(oAnnotation) {
            return oAnnotation["EntryTypeId.Id"] === sEntryTypeId;
        });

        var sMarkup = this.AnnotationsListConverter.buildMarkup(aFilteredAnnotations);
        var aEntryTypes = oRunJsonModel.getProperty("/entryTypes/header");
        Object.values(aEntryTypes).forEach(function(oEntryType) {
            if (oEntryType.Id === sEntryTypeId) {
                oEntryType.Markup = sMarkup;
            }
        });
        oRunJsonModel.refresh(false);
    },

    onOpenChangeDialog : function(oEvent) {
        var oModel = oEvent.getSource().getModel();
        this._changeDialog = sap.ui.xmlfragment("sap.secmon.ui.loglearning.dialog.ChangeAnnotationDialog", this);
        this.getView().addDependent(this._changeDialog);
        this._changeDialog.setModel(oModel);
        this._changeDialog.open();

    },

    onCloseChangeAnnotationDialog : function() {
        this._changeDialog.close();
        this._changeDialog.destroy();
    },

    onChangeAnnotation : function(oEvent) {
        var sTimestampType = this.Constants.ANNOTATION_TYPES.TIMESTAMP, sWordType = this.Constants.ANNOTATION_TYPES.WORD;

        var oRunJsonModel = this.getView().getModel();
        var oDialogModel = oEvent.getSource().getModel();
        var oBindingContext = oDialogModel.getProperty("/bindingContext");
        var sSelectedType = oDialogModel.getProperty("/selectedType");
        var sPattern = oDialogModel.getProperty("/pattern");
        var sFixedValue = oDialogModel.getProperty("/valueAnnotation");
        var annotationId = oDialogModel.getProperty("/id");
        var aAnnotations = oRunJsonModel.getProperty("/entryTypes/allAnnotations");
        var oModel = oBindingContext.getModel();
        oModel.setProperty("Type", sSelectedType, oBindingContext);
        oModel.setProperty("FixedValue", sSelectedType !== sWordType ? "" : sFixedValue, oBindingContext);
        oModel.setProperty("Pattern", sSelectedType !== sTimestampType ? "" : sPattern, oBindingContext);

        Object.values(aAnnotations).forEach(function(oElement) {
            if (oElement.Id === annotationId) {
                oElement.Type = sSelectedType;
                oElement.FixedValue = sSelectedType !== sWordType ? "" : sFixedValue;
                oElement.Pattern = sSelectedType !== sTimestampType ? "" : sPattern;
            }
        });

        var aMergedList = sap.secmon.ui.loglearning.util.AnnotationsListConverter.mergeAndAdaptPositions(aAnnotations);
        oRunJsonModel.setProperty("/entryTypes/allAnnotations", aMergedList);

        // we need to trigger a change event manually because length of annotations list has not changed
        oRunJsonModel.refresh(true);
        this._setSaveNeeded(true);
        this.onCloseChangeAnnotationDialog();

    },

    /**
     * reset annotation to original type, value, and pattern (as determined by log learning discovery).
     */
    onResetAnnotation : function(oEvent) {
        var sTimestampType = this.Constants.ANNOTATION_TYPES.TIMESTAMP, sWordType = this.Constants.ANNOTATION_TYPES.WORD;

        var sOriginalText = "", sOriginalPattern = "";
        var oRunJsonModel = this.getView().getModel();
        var oDialogModel = oEvent.getSource().getModel();
        var oBindingContext = oDialogModel.getProperty("/bindingContext");
        var annotationId = oDialogModel.getProperty("/id");
        var aAnnotations = oRunJsonModel.getProperty("/entryTypes/allAnnotations");
        var oModel = oBindingContext.getModel();

        var sOriginalType = oBindingContext.getProperty("OriginalType");
        if (sOriginalType === sTimestampType) {
            sOriginalPattern = oBindingContext.getProperty("OriginalPattern");
        }
        if (sOriginalType === sWordType) {
            sOriginalText = oBindingContext.getProperty("OriginalFixedValue");
        }

        oModel.setProperty("Type", sOriginalType, oBindingContext);
        oModel.setProperty("Pattern", sOriginalPattern, oBindingContext);
        oModel.setProperty("FixedValue", sOriginalText, oBindingContext);

        Object.values(aAnnotations).forEach(function(oElement) {
            if (oElement.Id === annotationId) {
                oElement.Type = sOriginalType;
                oElement.FixedValue = sOriginalText;
                oElement.Pattern = sOriginalPattern;
            }
        });

        var aMergedList = sap.secmon.ui.loglearning.util.AnnotationsListConverter.mergeAndAdaptPositions(aAnnotations);
        oRunJsonModel.setProperty("/entryTypes/allAnnotations", aMergedList);

        // we need to trigger a change event manually because length of annotations list has not changed
        oRunJsonModel.refresh(true);
        this._setSaveNeeded(true);
    },

    /** called when a token is deleted */
    onDeleteAnnotation : function(oEvent) {

        var oRunJsonModel = this.getView().getModel();
        var aAnnotations = oRunJsonModel.getProperty("/entryTypes/allAnnotations");
        var sRemovedItemKey = oEvent.getParameter("token").getKey();
        var oSelectedAnnotation = null;
        aAnnotations.forEach(function(oAnnotation) {
            if (oAnnotation.Id === sRemovedItemKey) {
                oSelectedAnnotation = oAnnotation;
                oSelectedAnnotation.Action = "REMOVE";
            }
        });

        var aNewAnnotations = sap.secmon.ui.loglearning.util.AnnotationsListConverter.removeAnnotation(aAnnotations, oSelectedAnnotation);
        oRunJsonModel.setProperty("/entryTypes/allAnnotations", aNewAnnotations);

        oRunJsonModel.refresh(true);
        this._setSaveNeeded(true);
    },

    onCloseTokenPopover : function(oEvent) {
        this._getTokenPopover(this).close();
    },

    _setEntryType : function(sRunName, sEntryTypeId) {
        // get entry type
        var model = this.getView().getModel();
        if (!model) {
            return;
        }
        var runData = model.getData();
        if (!runData || Object.keys(runData).length === 0) {
            return;
        }

        if (sRunName !== runData.run.RunName) {
            // TODO: somehow reload the correct run
            return;
        }

        var index, sHasKeyValueList, sHasStructuredList, sEventHash, bCustomRegexExists;
        for (var i = 0; i < Object.keys(runData.entryTypes.header).length; i++) {
            var oEntryType = runData.entryTypes.header[i];
            if (sEntryTypeId === oEntryType.Id) {
                index = i;
                sHasKeyValueList = oEntryType.sHasKeyValueList;
                sHasStructuredList = oEntryType.HasStructuredList;
                sEventHash = oEntryType.EventHash;
                bCustomRegexExists = oEntryType.CustomIdentifier && oEntryType.CustomIdentifier.length > 0;
                break;
            }
        }

        // TODO: This is probably never used?
        this.getView().getModel().setProperty("/eventHashOfSelectedMarkup", sEventHash);

        // TODO: use element binding / binding relative to a binding context for all the other bindings.

        var sBindingPath = "/entryTypes/header/" + index;

        this.uiModel.setProperty("/entryTypeIndex", index + 1);
        this.uiModel.setProperty("/entryTypeId", sEntryTypeId);
        this.uiModel.setProperty("/runName", sRunName);
        this.uiModel.setProperty("/HasKeyValueList", sHasKeyValueList);
        this.uiModel.setProperty("/HasStructuredList", sHasStructuredList);

        this.getView().bindElement(sBindingPath);

        var oTableOriginalRecords = this.getView().byId("tableOriginalRecords");
        var oBinding = oTableOriginalRecords.getBinding("rows");
        if (oBinding) {
            oBinding.filter(new sap.ui.model.Filter({
                path : "EntryTypeId",
                operator : sap.ui.model.FilterOperator.EQ,
                value1 : sEntryTypeId
            })).sort(new sap.ui.model.Sorter("LineNumber", false));
        }

        var oTokenizer = this.getView().byId("annotationTokenizer");
        oBinding = oTokenizer.getBinding("tokens");
        if (oBinding) {
            var oFilter = this.AnnotationsListConverter.createFilterOfTopAnnotations(sEntryTypeId);
            oBinding.filter(oFilter);
        }

        this._loadEventDetails(sEventHash, sEntryTypeId);

        // does the entry type have a custom regex?
        var oRunModel = sap.ui.getCore().getModel("RunModel");
        oRunModel.setProperty("/selectedEntryTypeHasCustomIdentifier", bCustomRegexExists);
    },

    /**
     * Handles the select log type event
     * 
     * @param oEvent
     * @param oController
     */
    onSelectLogType : function(oEvent) {
        this._setSaveNeeded(true);
    },

    onEventSelected : function(oEvent) {
        this._setSaveNeeded(true);
        var oContext = oEvent.getSource().getBindingContext();
        var sRunName = oContext.getProperty("RunName");
        var id = oContext.getProperty("Id");
        this._setEntryType(sRunName, id);
    },

    /**
     * Sets the save needed flag
     * 
     * @param bSaveNeeded
     */
    _setSaveNeeded : function(bSaveNeeded) {
        sap.ui.getCore().getModel("RunModel").setProperty("/isSaveNeeded", bSaveNeeded);
    },

    /**
     * Loads the details of the given event
     * 
     * @param sEventHashHex
     */
    _loadEventDetails : function(sEventHashHex, sEntryTypeId) {
        var oModel = this.getView().getModel();

        var oEntryTypeData = oModel.getData();

        var kbModel = sap.ui.getCore().getModel("KBRoleModel");
        if (sEventHashHex !== "30") {
            var sODataPath = "/sap/secmon/services/KnowledgeBase.xsodata/Event(X'" + sEventHashHex + "')?$expand=Attributes";
            // The JSON model is bound against an ODATA service
            kbModel.loadData(sODataPath, null, true);
            kbModel.attachRequestCompleted(function() {
                this.prepareDisplayData(oEntryTypeData, sEventHashHex, sEntryTypeId);
            }.bind(this));
        } else {
            kbModel.setData({
                d : {
                    Attributes : {
                        results : [ {
                            attrHash : "MA==",
                            "attrName.name" : "",
                            "attrNameSpace.nameSpace" : ""
                        } ]
                    }
                }
            });
            this.prepareDisplayData(oEntryTypeData, sEventHashHex, sEntryTypeId);
        }
    },

    prepareDisplayData : function(oEntryTypeData, sEventHashHex, sEntryTypeId) {
        // Inject attributes and roles valid for selected event
        // into the annotations table data model to allow
        // different values in the respective drop downs in each row
        this._calculateRolesAndAttributes(oEntryTypeData.entryTypes.allAnnotations, sEventHashHex, sEntryTypeId);
        this._calculateRolesAndAttributes(oEntryTypeData.valueMapping.target, sEventHashHex, sEntryTypeId);
        this._calculateRolesAndAttributes(oEntryTypeData.constantValue, sEventHashHex, sEntryTypeId);

        var oModel = this.getView().getModel();
        if (oModel) {
            oModel.setData(oEntryTypeData);
        }
    },

    /**
     * Inject attributes list into aData, also add temporary attributes "attrDisplayName", attrName.name", and "attrNameSpace.nameSpace". The attributes list is used for valuehelp. The temporary
     * attributes are used in UI for display. Instead of displaying the attribute ID ("AttrHash"), the attribute names are displayed. The temporary attributes are lower-case as opposed to the original
     * attributes from OData or command "openRun". The attributes and temporary attributes are stripped before persisting (see ShellRun.controller, function "onPressSave".
     * 
     * TODO: Refactor. This approach is not maintainable.
     * 
     * @param aData
     * @param aDataAnnotationModel
     */
    _calculateRolesAndAttributes : function(aData, sEventHashHex, sEntryTypeId) {
        var oController = this;
        var oKBRoleModelData = sap.ui.getCore().getModel("KBRoleModel").getData().d;
        var aAttr;
        var bAttrExists = false;
        var bAttrListExists = false;

        $.each(aData, function(iIndex, oValue) {
            if (oValue["EntryTypeId.Id"] !== sEntryTypeId) {
                return true; // Continue
            }

            // // "30" is the null event
            if (sEventHashHex !== "30") {
                // Check if assigned attribute is still
                // valid
                aData[iIndex].Attributes = oKBRoleModelData.Attributes.results;
                aData[iIndex].attrDisplayName = "";
                aData[iIndex]["attrName.name"] = "";
                aData[iIndex]["attrNameSpace.nameSpace"] = "";
                aData[iIndex].attrDataType = "";

                bAttrListExists = (aData[iIndex].AttrHashList !== undefined);
                if (bAttrListExists) {
                    aData[iIndex].TargetAttributeIds = [];
                }
                bAttrExists = false;
                $.each(aData[iIndex].Attributes, function(iIndexEntity, oValueEntity) {

                    aAttr = bAttrListExists ? aData[iIndex].AttrHashList.split("|") : [ aData[iIndex].AttrHash ];

                    $.each(aAttr, function(index, element) {
                        if (element === oController.oCommons.base64ToHex(oValueEntity.attrHash)) {
                            bAttrExists = true;
                            aData[iIndex].attrDisplayName += oValueEntity.attrDisplayName + " | ";
                            aData[iIndex]["attrName.name"] += oValueEntity["attrName.name"] + " | ";
                            aData[iIndex]["attrNameSpace.nameSpace"] += oValueEntity["attrNameSpace.nameSpace"] + " | ";
                            aData[iIndex].attrDataType = oValueEntity.attrDataType;
                            if (bAttrListExists) {
                                aData[iIndex].TargetAttributeIds.push({
                                    hash : oValueEntity.attrHash,
                                    hashHex : element,
                                    name : oValueEntity["attrName.name"],
                                    nameSpace : oValueEntity["attrNameSpace.nameSpace"],
                                    displayName : oValueEntity.attrDisplayName,
                                    dataType : oValueEntity.attrDataType
                                });
                            } else {
                                aData[iIndex].TargetAttributeId = {
                                    hash : oValueEntity.attrHash,
                                    hashHex : element,
                                    name : oValueEntity["attrName.name"],
                                    nameSpace : oValueEntity["attrNameSpace.nameSpace"],
                                    displayName : oValueEntity.attrDisplayName,
                                    dataType : oValueEntity.attrDataType
                                };
                            }
                        }
                    });

                });
                if (!bAttrExists) {
                    // Side-effect!!!!!
                    // It seems to cater the case that an attribute in knowledgebase has been deleted.
                    // Then the corresponding attribute reference in loglearning is automatically discarded???
                    console.debug("Attribute %s does not exist for selected event --> Clear previously selected role and offer all roles of event for selection", aData[iIndex].AttrHashList);
                    if (bAttrListExists) {
                        aData[iIndex].AttrHashList = "30";
                        aData[iIndex].TargetAttributeIds = [];
                    }
                    aData[iIndex].attrDisplayName = "";
                    aData[iIndex]["attrName.name"] = "";
                    aData[iIndex]["attrNameSpace.nameSpace"] = "";
                    aData[iIndex].attrDataType = "";
                } else {
                    // strip trailing '|'
                    aData[iIndex].attrDisplayName = aData[iIndex].attrDisplayName.slice(0, -3);
                    aData[iIndex]["attrName.name"] = aData[iIndex]["attrName.name"].slice(0, -3);
                    aData[iIndex]["attrNameSpace.nameSpace"] = aData[iIndex]["attrNameSpace.nameSpace"].slice(0, -3);
                }

            } else { // else (no event is selected)
                aData[iIndex].Attributes = [ {
                    "attrName.name" : "",
                    "attrNameSpace.nameSpace" : "",
                    "attrDisplayName" : "",
                    "attrDataType" : ""
                } ];
            }

            // Sort alphabetically
            aData[iIndex].Attributes.sort(function(a, b) {
                var nameA = a.attrDisplayName.toLowerCase(), nameB = b.attrDisplayName.toLowerCase();
                if (nameA < nameB) { // sort string ascending
                    return -1;
                }
                if (nameA > nameB) {
                    return 1;
                }
                return 0; // default return value (no sorting)
            });

        });

    },

    /**
     * navigate up to list of entry types
     */
    onNavUp : function() {
        var that = this;
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            var sRunName = that.uiModel.getProperty("/runName");
            var oRouter = that.getRouter();
            oRouter.navTo("entryTypes", {
                run : sRunName,
                query : {
                    lastNav : that.oCommons.formatDateToYyyymmddhhmmssUTC(new Date())
                }
            }, false);
        });
    },

    onChangeCustomIdentifier : function(oEvent) {
        this._setSaveNeeded(true);
    },

    validateRegex : function(oEvent) {
        var input = oEvent.getSource();
        var sRegex = oEvent.getParameter("newValue");

        var sMarkup = sRegex; // " does not matter

        var bRegexExists = sRegex && sRegex.length > 0;
        if (bRegexExists) {
            try {
                // User will input regex for Java (with named groups and negative lookbehind).
                // But validation happens in browser with JS Regex.
                var sDowngradedRegex = sap.secmon.ui.loglearning.util.Formatter.downgradeRegex(sRegex);
                var oRegex = new RegExp(sDowngradedRegex);
                oRegex.exec(sMarkup);

                input.setValueState(sap.ui.core.ValueState.None);
                input.setValueStateText("");

            } catch (e) {
                input.setValueState(sap.ui.core.ValueState.Error);
                input.setValueStateText(e.toLocaleString());
            }
        } else {
            input.setValueState(sap.ui.core.ValueState.Error);
            input.setValueStateText(null);
        }

        var oRunModel = sap.ui.getCore().getModel("RunModel");
        oRunModel.setProperty("/selectedEntryTypeHasCustomIdentifier", bRegexExists);
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
    }
});
