jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.FilterSortUtil");
jQuery.sap.require("sap.secmon.ui.m.exemptions.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.QueryExtractor");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.m.commons.patternSuggestion.PatternSuggestionHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.ServiceConstants");
jQuery.sap.require("sap.secmon.ui.m.commons.controls.SortOrder");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.secmon.ui.m.commons.FilterBarHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.BookmarkCreator");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/common.css");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.exemptions.view.Exemptions", {

    EXCEPTION_SERVICE : "/sap/secmon/services/ui/m/alertexceptions/AlertException.xsodata/",
    EXCEPTION_UPDATE_SERVICE : "/sap/secmon/services/ui/m/alertexceptions/AlertException.xsjs/",
    QUBE_SEARCH_SERVICE_URL : "/sap/secmon/services/ui/m/QubeSearch.xsodata/QubeSearch?$format=json&search=",
    DEFAULT_ORDER_BY : "exemptionDescription",
    DEFAULT_ORDER_DESC : false,

    onInit : function() {
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.oBookmarkCreator = new sap.secmon.ui.m.commons.BookmarkCreator();

        var fnNavigation = function() {
            this.navToWithAggregatedParameters("main");
        };
        sap.secmon.ui.m.commons.FilterBarHelper.initialize.call(this, "exemptionsTable", sap.secmon.ui.m.commons.ServiceConstants.EXEMPTIONS_SERVICE, fnNavigation, [ "patternFilterInput",
                "patternTypeFilterInput", "validityFilterInput", "testModeFilterInput", "statusFilterInput" ], [ this.getComponent().getModel(), this.getComponent().getModel(),
                this.getComponent().getModel("exemptionDetail") ]);
        sap.ui.core.UIComponent.getRouterFor(this).attachRouteMatched(this.onRouteMatched, this);
        var oTable = this.getExemptionsTable();
        this.enableButtonsIfAtLeastOneRowIsSelected(oTable, [ "deleteButton" ]);
    },

    onExemptionPress : function(oEvent) {
        var exemptionId = oEvent.getSource().getBindingContext("exemptions").getProperty("ExceptionId");
        this.getRouter().navTo("exemption", {
            Id : exemptionId,
        });
    },

    onRouteMatched : function(oEvent) {
        if (oEvent.getParameter("name") !== "main") {
            return;
        }

        var oArguments = oEvent.getParameter("arguments");
        var params = oArguments["?query"];
        var oQueryObject = {};
        if (params) {
            oQueryObject = params;
        }

        // apply the url parameters to the view settings control and
        // perform the filtering if everything is ok
        var queryExtractor = new sap.secmon.ui.m.commons.QueryExtractor(sap.secmon.ui.m.commons.ServiceConstants.EXEMPTIONS_SERVICE, this.DEFAULT_ORDER_BY, this.DEFAULT_ORDER_DESC);
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

    getExemptionsTable : function() {
        return this.getView().byId("exemptionsTable");
    },

    getSelectedExemptionIds : function() {
        var aContexts = this.getExemptionsTable().getSelectedContexts();
        var aValues = [];
        aContexts.forEach(function(oContext) {
            aValues.push(oContext.getProperty("ExceptionId"));
        });
        return aValues;

    },

    onDeleteExemptions : function() {
        var aExceptionIds = this.getSelectedExemptionIds();
        var that = this;

        var confirmationText = sap.secmon.ui.commons.Formatter.i18nText(this.getText("Delete_Confirm"));
        sap.m.MessageBox.confirm(confirmationText, {
            title : this.getCommonText("Delete_TIT"),
            icon : sap.m.MessageBox.Icon.WARNING,
            actions : [ sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL ],
            onClose : function(oAction) {
                if (oAction === sap.m.MessageBox.Action.DELETE) {
                    $.ajax({
                        type : "DELETE",
                        url : that.EXCEPTION_UPDATE_SERVICE,
                        data : JSON.stringify(aExceptionIds),
                        beforeSend : function(xhr) {
                            xhr.setRequestHeader("X-CSRF-Token", that.getComponent().getCsrfToken());
                        },
                        success : function(data) {
                            that.getView().getModel("exemptions").refresh(false);
                            sap.m.MessageToast.show(sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/m/exemptions/i18n/UIText.hdbtextbundle", "Delete_Success"));
                        },

                        error : function(XMLHttpRequest, textStatus, errorThrown) {
                            sap.m.MessageBox.alert(XMLHttpRequest.responseText, {
                                title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/CommonUIText.hdbtextbundle", "Error_TIT")
                            });

                        }
                    });
                }
            }
        });
    },

    navToWithAggregatedParameters : function(sRouteName) {
        var oNewQueryParameters = {};
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromTableSorting.call(this, oNewQueryParameters);
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromFilterBar.call(this, oNewQueryParameters, [ "patternFilterInput" ]);

        // The router has a "feature" not to dispatch to event handlers if
        // neither route nor query parameters have changed.
        // In order to force navigation, we add a parameter with new value each
        // time.
        oNewQueryParameters.lastNav = this.oCommons.formatDateToYyyymmddhhmmssUTC(new Date());

        sap.ui.core.UIComponent.getRouterFor(this).navTo("main", {
            query : oNewQueryParameters
        }, true);
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

    onSearchPatternSelectDialog : function(oEvent) {
        var sValue = oEvent.getParameter("value");
        var oFilter = new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, sValue);
        var oBinding = oEvent.getSource().getBinding("items");
        oBinding.filter([ oFilter ]);
    },

    onConfirmPatternSelectDialog : function(oEvent) {
        var aContexts = oEvent.getParameter("selectedContexts");

        var aNewSelectedPatternFilterItems = aContexts.map(function(oContext) {
            return {
                path : "Id",
                filterValue : this.oCommons.base64ToHex(oContext.getObject().Id)
            };
        }, this);

        var aSelectedFilterItemsForFilterBar = sap.secmon.ui.m.commons.FilterBarHelper.getSelectedFilterItemsFromFilterBar.call(this).filter(function(oSelectedFilterItem) {
            return oSelectedFilterItem.path !== "Id";
        }).concat(aNewSelectedPatternFilterItems);

        sap.secmon.ui.m.commons.FilterBarHelper.applySelectedFilterItemsToFilterBar.call(this, aSelectedFilterItemsForFilterBar, undefined, true);
        this.getView().byId("patternFilterInput").focus();
    },

    handleSuggestionItemSelected : function(oEvent) {
        sap.secmon.ui.m.commons.patternSuggestion.PatternSuggestionHelper.handleSuggestionItemSelected.call(this, oEvent);
    },

    onPatternSuggest : function(oEvent) {
        sap.secmon.ui.m.commons.patternSuggestion.PatternSuggestionHelper.handleSuggest.call(this, oEvent);
    },

    handleBookmarkDialogButtonPressed : function(oEvent) {
        var oParameters = {};
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromTableSorting.call(this, oParameters);
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromFilterBar.call(this, oParameters, [ "patternFilterInput" ]);
        oParameters.doNotEncode = true;

        var sTitle = this.getText("MBookmark_ExemptionsXLBL");
        this.oBookmarkCreator.showBookmarkCreationDialog(this.getView(), sTitle, oParameters, "Exemptions");
    },

    onNavBack : function() {
        window.history.go(-1);
    },

    onPressHelp : function(oEvent) {
        window.open("/sap/secmon/help/1ad487e0ef264b739ee5f2a52ffa047e.html");
    }

});