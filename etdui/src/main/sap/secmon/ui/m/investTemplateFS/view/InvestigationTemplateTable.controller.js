//jQuery.sap.declare("sap.secmon.ui.m.views.investigationTemplateFS.InvestigationTemplate");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.InputValidationService");
jQuery.sap.require("sap.secmon.ui.commons.EnumService");
jQuery.sap.require("sap.secmon.ui.m.invest.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.FilterBarHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.ServiceConstants");
jQuery.sap.require("sap.secmon.ui.m.commons.QueryExtractor");
jQuery.sap.require("sap.secmon.ui.m.commons.patternSuggestion.PatternSuggestionHelper");
jQuery.sap.require("sap.secmon.ui.m.investTemplateFS.util.ODataErrorHandler");
jQuery.sap.require("sap.secmon.ui.commons.AjaxUtil");
jQuery.sap.require("sap.m.MessageToast");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/common.css");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.investTemplateFS.view.InvestigationTemplateTable", {

    DEFAULT_ORDER_BY : "patternName",
    DEFAULT_ORDER_DESC : true,

    EXPORT_UPSERT : "Upsert",
    EXPORT_DELETE : "Delete",

    EXPORT_SERVICE : "/sap/secmon/services/replication/export.xsjs",
    NAMESPACE : "http://sap.com/secmon",

    // used by PatternSuggestionHelper
    QUBE_SEARCH_SERVICE_URL : "/sap/secmon/services/ui/m/QubeSearch.xsodata/QubeSearch?$format=json&search=",

    oCommons : new sap.secmon.ui.commons.CommonFunctions(),
    uiModel : null,

    onInit : function() {

        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.getRoute("main").attachMatched(this.onRouteMatched, this);

        this.ajaxUtil = new sap.secmon.ui.commons.AjaxUtil();

        this.uiModel = new sap.ui.model.json.JSONModel({
            templatesCount : 0
        });
        this.getView().setModel(this.uiModel, "uiModel");

        var fnNavigation = function() {
            this._navToWithAggregatedParameters();
        };
        var aInputs = this.getFilterInputIdsOfFilterBar();
        sap.secmon.ui.m.commons.FilterBarHelper.initialize.call(this, "TemplateTable", sap.secmon.ui.m.commons.ServiceConstants.INVESTIGATIONTEMPLATES_SERVICE, fnNavigation, aInputs, [ this
                .getComponent().getModel() ]);

        var oTable = this.getTemplateTable();
        this.enableButtonsIfAtLeastOneRowIsSelected(oTable, [ "deleteButton", "exportButton" ]);
        
        this._addValidatorTemplateNameInput();   
    },

    onRouteMatched : function(oEvent) {

        var oArguments = oEvent.getParameter("arguments");

        var params = oArguments["?query"];
        var oQueryObject = {};
        if (params) {
            // URL contains parameters
            oQueryObject = params;
        }

        var queryExtractor = new sap.secmon.ui.m.commons.QueryExtractor(sap.secmon.ui.m.commons.ServiceConstants.INVESTIGATIONTEMPLATES_SERVICE, this.DEFAULT_ORDER_BY, this.DEFAULT_ORDER_DESC);
        var oSorter = queryExtractor.extractSorter(oQueryObject);
        var aFilters = queryExtractor.extractFilters(oQueryObject);

        sap.secmon.ui.m.commons.FilterBarHelper.applySorting.call(this, oSorter.sPath, oSorter.bDescending);
        sap.secmon.ui.m.commons.FilterBarHelper.applyFiltersToFilterBar.call(this, aFilters);

        sap.secmon.ui.m.commons.FilterBarHelper.setFilters.call(this, aFilters);

        // apply the filter and sorter
        sap.secmon.ui.m.commons.FilterBarHelper.applyFiltersAndSorter.call(this, {
            filters : aFilters,
            sorter : oSorter
        });
    },

    onSelect : function(oEvent) {
        var context = oEvent.getSource().getBindingContext();
        var contextPath = context.getPath();
        this._navTo("display", {
            id : contextPath.slice(1),
            context : context
        }, false);
    },

    onPatternPress : function(oEvent) {
        var context = oEvent.getSource().getBindingContext();
        var patternId = context.getProperty("PatternId");
        var hexId = this.oCommons.base64ToHex(patternId);
        sap.secmon.ui.m.commons.NavigationService.navigateToPattern(hexId);
    },

    onCreate : function(oEvent) {
        this._navTo("create", {}, true);
    },

    onUpdateFinished : function(oEvent) {
        var count = oEvent.getSource().getBinding("items").getLength();
        this.uiModel.setProperty("/templatesCount", count);
    },

    onDelete : function(oEvent) {
        var table = this.getTemplateTable();
        var selectedItem;
        var aSelectedItems;
        var controller = this;
        var confirmationText = this.getText("ConfDelete_MSG");
        if (table) {
            selectedItem = table.getSelectedItem();
            aSelectedItems = table.getSelectedItems();
            if (aSelectedItems.length > 0) {
                sap.m.MessageBox.confirm(confirmationText, function(oAction) {
                    if (oAction === sap.m.MessageBox.Action.OK) {
                        deleteSelectedItems.call(controller, aSelectedItems);
                    }
                });
            }
        }

        function deleteSelectedItems(aSelectedItems) {
            sap.ui.core.BusyIndicator.show();

            var controller = this;
            var aBatchChanges = [];
            var oModel = controller.getView().getModel();
            // look for changed values
            for (var index = 0; index < aSelectedItems.length; index++) {
                var selectedItem = aSelectedItems[index];
                var data = selectedItem.getBindingContext().getObject();
                var hexId = this.oCommons.base64ToHex(data.Id);
                var templatePath = "InvestigationTemplate(X'" + hexId + "')";
                aBatchChanges.push(oModel.createBatchOperation(templatePath, "DELETE"));
            }
            oModel.setUseBatch(true);
            oModel.addBatchChangeOperations(aBatchChanges);
            oModel.submitBatch(function(data) {
                // on a batch request, returned data holds an array
                var dirty;
                var oI18nModel = controller.getView().getModel("i18n");
                var oI18nCommonModel = controller.getView().getModel("i18nCommon");
                data.__batchResponses.forEach(function(responseObject) {
                    if (responseObject.response && responseObject.response.statusCode >= 300) {
                        dirty = true;
                        sap.secmon.ui.m.investTemplateFS.util.ODataErrorHandler.showAlert(responseObject.response, oI18nModel, oI18nCommonModel);
                    }
                    if (responseObject.__changeResponses) {
                        responseObject.__changeResponses.forEach(function(changeResponse) {
                            if (changeResponse.statusCode >= 300) {
                                dirty = true;
                                sap.secmon.ui.m.investTemplateFS.util.ODataErrorHandler.showAlert(responseObject.response, oI18nModel, oI18nCommonModel);
                            }
                        });
                    }
                });
                sap.ui.core.BusyIndicator.hide();
                if (!dirty) {
                    sap.m.MessageToast.show(controller.getText("Deleted_MSG"));                    
                    controller.doExport(aSelectedItems, controller.EXPORT_DELETE);
                }
                oModel.refresh(true);
            }, function(error) {
                // unused in batch request
                sap.ui.core.BusyIndicator.hide();
            });
            oModel.setUseBatch(false);
        }
    },

    onPatternSuggest : function(oEvent) {
        sap.secmon.ui.m.commons.patternSuggestion.PatternSuggestionHelper.handleSuggest.call(this, oEvent);
    },

    onSearchPatternSelectDialog : function(oEvent) {
        var sValue = oEvent.getParameter("value");
        var oFilter = new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, sValue);
        var oBinding = oEvent.getSource().getBinding("items");
        oBinding.filter([ oFilter ]);
    },

    handleSuggestionItemSelected : function(oEvent) {
        sap.secmon.ui.m.commons.patternSuggestion.PatternSuggestionHelper.handleSuggestionItemSelected.call(this, oEvent);
        this.getView().getModel().refresh();
    },

    onPatternValueHelpRequest : function(oEvent) {
        var patternInput = oEvent.getSource();

        if (!this.patternSelectDialog) {
            this.patternSelectDialog = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.m.commons.patternSuggestion.PatternSelectDialog", this);
            // set growing threshold to same size as patterns model in
            // EtdComponent which is 5000

            this.patternSelectDialog.setGrowingThreshold(this.getComponent().getModel("Patterns").iSizeLimit || 5000);
            this.getView().addDependent(this.patternSelectDialog);
        }
        // toggle compact style
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.patternSelectDialog);

        // mark selected items
        this.patternSelectDialog.getItems().forEach(function(oItem) {
            var sPatternId;
            for (var i = 0; i < oItem.getCustomData().length; i++) {
                if (oItem.getCustomData()[i].getKey() === "patternId") {
                    sPatternId = this.oCommons.base64ToHex(oItem.getCustomData()[i].getValue());
                    break;
                }
            }

            if (sPatternId) {
                if (patternInput.getTokens().some(function(oToken) {
                    return oToken.getKey() === sPatternId;
                })) {
                    oItem.setSelected(true);
                } else {
                    oItem.setSelected(false);
                }
            }
        }, this);
        this.patternSelectDialog.getBinding("items").filter([]);

        this.patternSelectDialog.open();
    },

    onConfirmPatternSelectDialog : function(oEvent) {
        var aContexts = oEvent.getParameter("selectedContexts");

        var aNewSelectedPatternFilterItems = aContexts.map(function(oContext) {
            return {
                path : "PatternId",
                filterValue : this.oCommons.base64ToHex(oContext.getObject().Id)
            };
        }, this);

        var aSelectedFilterItemsForFilterBar = sap.secmon.ui.m.commons.FilterBarHelper.getSelectedFilterItemsFromFilterBar.call(this).filter(function(oSelectedFilterItem) {
            return oSelectedFilterItem.path !== "PatternId";
        }).concat(aNewSelectedPatternFilterItems);

        sap.secmon.ui.m.commons.FilterBarHelper.applySelectedFilterItemsToFilterBar.call(this, aSelectedFilterItemsForFilterBar, undefined, true);
        this.getView().byId("patternFilterInput").focus();
    },

    onExportSelectedPressed : function(oEvent) {
        var table = this.getTemplateTable();
        if (table) {
            var aSelectedItems = table.getSelectedItems();
            if (aSelectedItems) {
                this.doExport(aSelectedItems);
            }
        }
    },

    onPressHelp : function(oEvent) {
        window.open("/sap/secmon/help/a36c4563b44448009e3545fe64130eca.html");
    },

    getFilterInputIdsOfFilterBar : function() {
        return [ "templateDescriptionInput", "patternFilterInput", "severityFilterInput", "managementVisibilityFilterInput", "attackFilterInput", "createdByFilterInput" ];
    },

    _navToWithAggregatedParameters : function() {
        var oNewQueryParameters = {};
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromTableSorting.call(this, oNewQueryParameters);
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromFilterBar.call(this, oNewQueryParameters, [ "patternFilterInput", "templateDescriptionInput" ]);

        // The router has a "feature" not to dispatch to event handlers if
        // neither route nor query parameters have changed.
        // In order to force navigation, we add a parameter with new value each
        // time.
        oNewQueryParameters.lastNav = this.oCommons.formatDateToYyyymmddhhmmssUTC(new Date());

        this._navTo("main", {
            query : oNewQueryParameters
        }, true);
    },

    _navTo : function(routeName, oParams, bReplace) {
        sap.ui.core.UIComponent.getRouterFor(this).navTo(routeName, oParams, bReplace);
    },

    _addValidatorTemplateNameInput : function(){
        var oTemplateDescriptionInput = this.getView().byId("templateDescriptionInput");

        oTemplateDescriptionInput.addValidator(function(args){
                var oItem = {
                    path : "TemplateDescription",
                    filterValue : args.text
                };
                var aSelectedFilterItemsForFilterBar = sap.secmon.ui.m.commons.FilterBarHelper.getSelectedFilterItemsFromFilterBar.call(this).filter(function(oSelectedFilterItem) {
                    return oSelectedFilterItem.path === "TemplateDescription";
                }).concat(oItem); 
                sap.secmon.ui.m.commons.FilterBarHelper.applySelectedFilterItemsToFilterBar.call(this, aSelectedFilterItemsForFilterBar, null, true);
        }.bind(this)); 
    },

    onNavBack : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

    getComponent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.getView()));
    },

    getSelectedTemplateIds : function() {
        var aContexts = this.getTemplateTable().getSelectedContexts();
        var aValues = [];
        aContexts.forEach(function(oContext) {
            aValues.push(oContext.getProperty("Id"));
        });
        return aValues;

    },

    getTemplateTable : function() {
        return this.getView().byId("TemplateTable");
    },

    doExport : function(selectedItems, operation) {
        var that = this;
        var aExportObjects = [];
        var op = operation || this.EXPORT_UPSERT;
        selectedItems.forEach(function(oSelectedItem) {
            var data = oSelectedItem.getBindingContext().getObject();
            var hexId = that.oCommons.base64ToHex(data.Id);
            aExportObjects.push({
                Id : hexId,
                ObjectType : "InvestigationTemplate",
                ObjectName : data.TemplateDescription,
                ObjectNamespace : that.NAMESPACE,
                Operation : op
            });
        });

        this.ajaxUtil.postJson(this.EXPORT_SERVICE, JSON.stringify(aExportObjects), {
            success : function(aParams) {
                sap.m.MessageToast.show(that.getText("Exported_MSG"));
            },
            fail : function(status, errorText) {
                if (operation !== that.EXPORT_DELETE || status === 400) {
                    sap.m.MessageBox.alert(errorText);
                }
            }
        });
    }

});
