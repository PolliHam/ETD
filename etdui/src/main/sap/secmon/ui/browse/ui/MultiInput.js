$.sap.declare("sap.secmon.ui.browse.MultiInput");

$.sap.require("sap.m.MultiInput");
$.sap.require("sap.secmon.ui.browse.utils");

/**
 * Custom control to wrap sapui5's sap.m.MultiInput for easy use
 * 
 * @see sap.m.MultiInput, sap.m.SelectDialog
 */

sap.m.MultiInput.extend("sap.secmon.ui.browse.MultiInput", {
    metadata : {
        properties : {},
        aggregations : {
            _valueHelp : {
                type : "sap.m.SelectDialog",
                multiple : false,
                visibility : "hidden"
            }
        },

        events : {
            valueHelpUpdated : {
                selectedItems : "object[]"
            },
        }
    },

    _sItemName : undefined,
    _sDefaultPath : undefined,

    init : function() {

        // call the init() of our super control
        if (sap.m.MultiInput.prototype.init) {
            sap.m.MultiInput.prototype.init.call(this);
        }

        this.setEnableMultiLineMode(true);
        this.setShowValueHelp(true);
        this.setShowSuggestion(true);

        var oSelectDialog = new sap.m.SelectDialog({
            growingThreshold : 500,
            multiSelect : true,
            rememberSelections : true,
            cancel : function(oEvent) {
                oEvent.getSource().getBinding("items").filter([]);
            },
            search : [ function(oEvent) {
                var sValue = oEvent.getParameter("value");
                var oFilter = new sap.ui.model.Filter(this._sItemName, sap.ui.model.FilterOperator.Contains, sValue);
                var oBinding = oEvent.getSource().getBinding("items");
                oBinding.filter([ oFilter ]);
            }, this ],
            confirm : [ function(oEvent) {
                var aSelItems = oEvent.getParameter("selectedItems").map(function(oItem) {
                    return {
                        key : oItem.data("key"),
                        text : oItem.getTitle(),
                        tooltip : oItem.getTooltip()
                    };
                });

                // fire the event for other actions
                this.fireValueHelpUpdated({
                    "selectedItems" : aSelItems
                });
            }, this ]
        });

        var that = this;
        this.attachValueHelpRequest(function(oEvent) {
            $.sap.syncStyleClass("sapUiSizeCompact", sap.secmon.ui.browse.utils.getView(), oSelectDialog);
            oSelectDialog.open();

            // clear the old search filter
            oSelectDialog.getBinding("items").sort(new sap.ui.model.Sorter(that._sItemName));
            oSelectDialog.getBinding("items").filter([]);

            var aTokens = oEvent.getSource().getTokens();
            var aItems = oSelectDialog.getItems();

            aTokens.forEach(function(oToken){
                var oItem = aItems.find(function(oItem){ 
                    return oItem.data("key") === oToken.getKey() || (oItem.data("key") === null && oToken.getKey() === "__null__");
                });
                oItem ? oItem.setSelected(true) : oItem.setSelected(false);
            });
        });

        this.setAggregation("_valueHelp", oSelectDialog);
    },

    renderer : {},

    bindAggregation : function(sAggregationName, oBindingInfo) {

        if (sap.m.MultiInput.prototype.bindAggregation) {
            sap.m.MultiInput.prototype.bindAggregation.call(this, sAggregationName, oBindingInfo);
        }

        // forward this bind
        var oSelectDialog = this.getAggregation("_valueHelp");

        switch (sAggregationName) {
        case "suggestionItems":
            // setup the item template binding
            var oBindingPart = oBindingInfo.template.getBindingInfo("text").parts[0];
            var oListItemTemplate = new sap.m.StandardListItem({
                title : oBindingInfo.template.getBindingInfo("text"),
                tooltip : oBindingInfo.template.getBindingInfo("tooltip"),
                // mark the items selected using databinding
                // tokens are selected in the valuehelp list
                // need to link both models so that automatic update works
                selected : {
                    parts : [ {
                        path : oBindingPart.model + '>' + oBindingPart.path,
                    }, {
                        path : this._sDefaultPath
                    }, ],
                    formatter : function(value, aTokens) {
                        return aTokens.some(function(token) {
                            return token === value || value === null && token === sap.secmon.ui.browse.Constants.C_VALUE.NULL;
                        });
                    }
                }
            }).addCustomData(new sap.ui.core.CustomData({
                key : "key"
            }).bindProperty("value", oBindingInfo.template.getBindingInfo("key")));

            // setup the item binding for value help dialog
            oSelectDialog.bindAggregation("items", {
                model : oBindingInfo.model,
                path : oBindingInfo.path,
                template : oListItemTemplate,
                templateShareable : false,
            });

            // for search filters and sorters
            this._sItemName = oBindingInfo.template.getBindingInfo("text").parts[0].path;

            break;
        case "tokens":
            this._sDefaultPath = oBindingInfo.path;
            break;
        }

        return this;
    }

});
