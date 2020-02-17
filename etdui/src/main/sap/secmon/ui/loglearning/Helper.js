/* globals oTextBundle */
jQuery.sap.declare("sap.secmon.ui.loglearning.Helper");

sap.secmon.ui.loglearning.Helper =
        function() {
            if (sap.secmon.ui.loglearning.Helper.prototype.singletoninstance) {
                return sap.secmon.ui.loglearning.Helper.prototype.singletoninstance;
            }
            sap.secmon.ui.loglearning.Helper.prototype.singletoninstance = this;

            this.oTextBundle = jQuery.sap.resources({
                url : "/sap/secmon/ui/UIText.hdbtextbundle",
                locale : sap.ui.getCore().getConfiguration().getLanguage()
            });

            /**
             * Creates a random UUID (Caution: Weak random number generator)
             */
            this.createUUID = function() {
                var sUUID = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });

                return sUUID.toUpperCase();
            };

            /**
             * Opens the valuehelp for selection of events.
             * 
             * @param that
             *            the controller of the view to which the popup should be added
             * @param sSearchString
             *            the search string preselected in search field
             * @return a promise with parameter "selectedItem". Can be null if the user canceled the selection.
             */
            this.openValueHelpEvent = function(that, sSearchString) {
                var oDeferred = $.Deferred();

                this._oTargetDialog = sap.ui.xmlfragment("sap.secmon.ui.loglearning.dialog.targetDialog", that);

                this._oTargetDialog.attachConfirm(function(oEvent) {
                    var oSelectedContext = oEvent.getParameter("selectedItem").getBindingContext("KBEventModel");
                    oDeferred.resolve(oSelectedContext);
                });

                this._oTargetDialog.attachLiveChange(function(oEvent) {
                    var sFilterValue = oEvent.getParameter("value");
                    var oDisplayName = new sap.ui.model.Filter("displayName", sap.ui.model.FilterOperator.Contains, sFilterValue);
                    var oName = new sap.ui.model.Filter("name", sap.ui.model.FilterOperator.Contains, sFilterValue);
                    var oNameSpace = new sap.ui.model.Filter("nameSpace", sap.ui.model.FilterOperator.Contains, sFilterValue);
                    var oMultiFilter = new sap.ui.model.Filter({
                        filters : [ oDisplayName, oName, oNameSpace ]
                    });
                    var aFilters = sFilterValue ? [ oMultiFilter ] : [];
                    var oBinding = oEvent.getParameter("itemsBinding");
                    oBinding.filter(aFilters);
                });

                this._oTargetDialog.attachCancel(function(oEvent) {
                    oDeferred.resolve(null);
                    oEvent.getSource().destroy();
                });

                that.getView().addDependent(this._oTargetDialog);
                this._oTargetDialog.open(sSearchString);
                return oDeferred.promise();
            };

            /**
             * Opens the value help for selection of event attribute.
             * 
             * @param that
             *            a view controller to which a popup is added
             * @param oData
             *            the list data to be displayed
             * @param searchString
             *            a string which filters the allowed values
             * @param bMultiSelect
             *            if multiple selections are allowed
             * @return a promise with array parameter "selectedContexts". The parameter is an array regardless whether the input parameter "bMultiSelect" is true or false.
             */
            this.openValueHelpEventAttribute = function(that, oData, searchString, preselectedKeys, bMultiSelect) {
                var oDeferred = $.Deferred();

                var dialogModel = new sap.ui.model.json.JSONModel(oData);
                dialogModel.setProperty("/preselectedKeys", preselectedKeys);
                that.getView().setModel(dialogModel, "dialogModel");
                this._oValueHelpDialog = sap.ui.xmlfragment("sap.secmon.ui.loglearning.dialog.valueHelpDialog", that);
                this._oValueHelpDialog.setMultiSelect(bMultiSelect);

                this._oValueHelpDialog.attachConfirm(function(oEvent) {
                    var oSelectedData = oEvent.getParameter("selectedContexts");
                    oDeferred.resolve(oSelectedData, true);
                });
                this._oValueHelpDialog.attachCancel(function(oEvent) {
                    oDeferred.resolve(null, false);
                });

                function filter(sFilterValue, oBinding) {
                    var oAttrRelevance = new sap.ui.model.Filter("attr.Relevance", sap.ui.model.FilterOperator.Contains, sFilterValue);
                    var oAttrDisplayName = new sap.ui.model.Filter("attrDisplayName", sap.ui.model.FilterOperator.Contains, sFilterValue);
                    var oAttrName = new sap.ui.model.Filter("attrName.name", sap.ui.model.FilterOperator.Contains, sFilterValue);
                    var oAttrNameSpace = new sap.ui.model.Filter("attrNameSpace.nameSpace", sap.ui.model.FilterOperator.Contains, sFilterValue);
                    var oAttrDataType = new sap.ui.model.Filter("attrDataType", sap.ui.model.FilterOperator.Contains, sFilterValue);
                    var oMultiFilter = new sap.ui.model.Filter({
                        filters : [ oAttrRelevance, oAttrDisplayName, oAttrName, oAttrNameSpace, oAttrDataType ]
                    });
                    var aFilters = sFilterValue ? [ oMultiFilter ] : [];

                    oBinding.filter(aFilters);
                }

                this._oValueHelpDialog.attachLiveChange(function(oEvent) {
                    var sFilterValue = oEvent.getParameter("value");
                    var oBinding = oEvent.getParameter("itemsBinding");
                    filter(sFilterValue, oBinding);
                });
                this._oValueHelpDialog.attachSearch(function(oEvent) {
                    var sFilterValue = oEvent.getParameter("value");
                    var oBinding = oEvent.getParameter("itemsBinding");
                    filter(sFilterValue, oBinding);
                });

                this._oValueHelpDialog.attachCancel(function(oEvent) {
                    oEvent.getSource().destroy();
                });

                that.getView().addDependent(this._oValueHelpDialog);
                this._oValueHelpDialog.open(searchString);
                return oDeferred.promise();
            };

            /**
             * Converts flat source table into hierarchical data for tree
             * 
             * @param oFlatData
             * @param sRelevantEntryTypeId
             */
            this.convertValueMappingFlatToTree = function(oFlatData, sRelevantEntryTypeId) {
                var iLastRule, iLastCondition, iRuleIndex, iCondIndex;
                var aResultData = [];

                // Build hierarchical object from flat object

                // Comment on the concept of MappingCondition and ConditionPrio:
                // The conditions are something like an unordered list with added property ConditionPrio to enable sorting:
                // - MappingCondition is a unique index on a condition. Not necessarily ordered (even though, in practice, it is ordered)
                // - ConditionPrio holds info on the order of conditions. In practice, conditionPrio and mappingCondition are identical.
                $.each(oFlatData, function(i, oData) {
                    if (oData["EntryTypeId.Id"] !== sRelevantEntryTypeId) {
                        return true;
                    }

                    if (iLastRule !== oData.MappingRule) {
                        aResultData.push({
                            icon : "sap-icon://contacts",
                            text : oTextBundle.getText("Interpret_MapRule"),
                            type : "RULE",
                            results : [],
                            "EntryTypeId.Id" : oData["EntryTypeId.Id"],
                            MappingRule : oData.MappingRule,
                            "RunName.RunName" : oData["RunName.RunName"]
                        });
                        iRuleIndex = aResultData.length - 1;
                        iLastCondition = null;
                    }

                    if (iLastCondition !== oData.MappingCondition) {
                        aResultData[iRuleIndex].results.push({
                            icon : "sap-icon://customer-order-entry",
                            text : oTextBundle.getText("Interpret_Condition"),
                            type : "PRIORITY",
                            "EntryTypeId.Id" : oData["EntryTypeId.Id"],
                            ConditionPrio : oData.ConditionPrio,
                            MappingRule : oData.MappingRule,
                            MappingCondition : oData.MappingCondition,
                            "RunName.RunName" : oData["RunName.RunName"],
                            results : [ {
                                icon : "sap-icon://folder",
                                text : oTextBundle.getText("Interpret_Source"),
                                type : "SOURCE",
                                "EntryTypeId.Id" : oData["EntryTypeId.Id"],
                                ConditionPrio : oData.ConditionPrio,
                                MappingRule : oData.MappingRule,
                                MappingCondition : oData.MappingCondition,
                                "RunName.RunName" : oData["RunName.RunName"]
                            }, {
                                icon : "sap-icon://target-group",
                                text : oTextBundle.getText("Interpret_Target"),
                                type : "TARGET",
                                "EntryTypeId.Id" : oData["EntryTypeId.Id"],
                                ConditionPrio : oData.ConditionPrio,
                                MappingRule : oData.MappingRule,
                                MappingCondition : oData.MappingCondition,
                                "RunName.RunName" : oData["RunName.RunName"]
                            } ]

                        });
                        iCondIndex = aResultData[iRuleIndex].results.length - 1;
                    }

                    iLastRule = oData.MappingRule;
                    iLastCondition = oData.MappingCondition;
                });

                return aResultData;
            };

            /**
             * Shows distinct values for the given annotation in the given entry type
             */
            this._ShowDistinctValues =
                    function(oController, oBindingContext, sTitle, fnValue) {
                        var sRunName = sap.ui.getCore().getModel("RunJSONModel").getData().run.RunName;
                        var sEntryTypeId = oBindingContext.getProperty("EntryTypeId.Id");
                        var sAnnotationId = oBindingContext.getProperty("AnnotationId.Id");
                        if (!sAnnotationId) {
                            sAnnotationId = oBindingContext.getProperty("Id");
                        }
                        var sAnnotationName = "";
                        var sAnnotationType = "";

                        // Determine annotation name
                        $.each(sap.ui.getCore().getModel("RunJSONModel").getData().entryTypes.allAnnotations, function(index, element) {
                            if (element.Id === sAnnotationId) {
                                sAnnotationName = element.VariableName;
                                sAnnotationType = element.Type;
                            }
                        });

                        // Get distinct values and execute regex
                        var promise =
                                new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/loginterpretation/runService.xsjs?command=loadDistinctValuesForAnnotation&runName=" +
                                        encodeURIComponent(sRunName) + "&entryTypeId=" + sEntryTypeId + "&annotationId=" + sAnnotationId + "&annotationType=" + sAnnotationType);
                        promise.fail(function(jqXHR, textStatus, errorThrown) {
                            sap.ui.getCore().byId("idShell").getController().reportErrorMessage(decodeURIComponent(jqXHR.responseText));
                        });
                        promise.done(function(data, textStatus, jqXHR) {
                            var aValues = data.annotationValues;
                            var iRows = 1;
                            var aConvertedValues = jQuery.map(aValues, function(oElem) {
                                ++iRows;
                                return {
                                    Value : fnValue ? fnValue(oElem.Value) : oElem.Value
                                };
                            });
                            var distinctValuesModel = new sap.ui.model.json.JSONModel(aConvertedValues);
                            oController.getView().setModel(distinctValuesModel, "distinctValuesModel");

                            var dialog = new sap.m.Dialog({
                                title : sTitle ? sTitle : oTextBundle.getText("Interpret_DistVal", sAnnotationName),
                                afterClose : function() {
                                    dialog.destroy();
                                },
                                content : new sap.m.List({
                                    items : {
                                        path : 'distinctValuesModel>/',
                                        template : new sap.m.StandardListItem({
                                            title : '{distinctValuesModel>Value}'
                                        })
                                    }
                                }),
                                endButton : new sap.m.Button({
                                    text : "{i18nCommon>Close_BUT}",
                                    press : function() {
                                        dialog.close();
                                    }
                                })
                            });

                            oController.getView().addDependent(dialog);
                            // toggle compact style
                            jQuery.sap.syncStyleClass("sapUiSizeCompact", oController.getView(), dialog);
                            dialog.open();
                        });
                    };

        };

sap.secmon.ui.loglearning.Helper.formatTimerange = function(type, tr, trFrom, trTo) {
    if (type === "Relative" && tr) {
        return oTextBundle.getText("Interpret_" + tr);
    } else if (type === "Absolute" && trFrom && trTo) {
        return trFrom + " - " + trTo;
    }
};