/* globals oTextBundle */
$.sap.declare("sap.secmon.ui.malimon.EventAttributes");

jQuery.sap.require("sap.secmon.ui.m.commons.controls.ColumnClickableTable");
jQuery.sap.require("sap.secmon.ui.m.commons.controls.SortableColumn");
jQuery.sap.require("sap.secmon.ui.malimon.Constants");

sap.ui.core.Control.extend("sap.secmon.ui.malimon.EventAttributes", {

    metadata : {
        properties : {
            width : {
                type : "sap.ui.core.CSSSize",
            // defaultValue : "100%"
            },
            height : {
                type : "sap.ui.core.CSSSize",
            // defaultValue : "1000px"
            },
            title : {
                type : "string",
                defaultValue : "No Event Selected"
            },
            showAdd2CaseFile : {
                type : "boolean",
                defaultValue : true
            }
        },
        aggregations : {
            _layout : {
                type : "sap.m.VBox",
                multiple : false,
                visibility : "hidden"
            },
            data : {
                type : "sap.ui.base.ManagedObject"
            },
        },
        events : {
            add2CaseFile : {},
            filterAttribute : {},
            displayPath : {}
        }
    },

    init : function() {
        var oAttriTable = new sap.secmon.ui.m.commons.controls.ColumnClickableTable({
            insert : false,
            fixedLayout : false,
            growing : true,
            growingScrollToLoad : true,
            growingThreshold : 100,
            firstColumnIsForSelection : false,
            columnPress : [ function(oEvent) {
                var oParameters = oEvent.getParameters();
                var oSortedColumn = oParameters.column;
                var sortOrder = oParameters.sortOrder;
                var oBinding = oEvent.getSource().getBinding("items");

                var sSortProperty = oSortedColumn.getSortProperty();
                var bSortDesc = (sortOrder === sap.secmon.ui.m.commons.controls.SortOrder.Descending);

                oEvent.getSource().getColumns().forEach(function(oColumn) {
                    if (oColumn !== oSortedColumn) {
                        if (oColumn instanceof sap.secmon.ui.m.commons.controls.SortableColumn) {
                            oColumn.setSorted(false);
                        }
                    }
                });
                oSortedColumn.setSorted(true);
                oSortedColumn.setSortOrder(sortOrder);

                var oSorter = new sap.ui.model.Sorter(sSortProperty, bSortDesc);
                oBinding.sort(oSorter);
            }, this ],
            columns : [ new sap.secmon.ui.m.commons.controls.SortableColumn({
                sortProperty : "displayName",
                header : new sap.secmon.ui.m.commons.controls.SortableItem({
                    text : oTextBundle.getText("MM_Event_ColAttri"),
                })
            }), new sap.secmon.ui.m.commons.controls.SortableColumn({
                sortProperty : "value",
                header : new sap.secmon.ui.m.commons.controls.SortableItem({
                    text : oTextBundle.getText("MM_Event_ColValue")
                })
            }) ],
            items : {
                path : "/data/",
                template : new sap.m.ColumnListItem({
                    cells : [ new sap.m.Label({
                        text : "{displayName}"
                    }), new sap.m.Link({
                        text : "{value}",
                        enabled : "{isHyperlink}",
                        press : [ function(oEvent) {
                            var sBindingPath = oEvent.getSource().getBindingContext().getPath();
                            var oEventAttributesModel = oEvent.getSource().getBindingContext().getModel();
                            var oParam = {
                                name : oEventAttributesModel.getProperty(sBindingPath + "/name"),
                                value : oEventAttributesModel.getProperty(sBindingPath + "/value")
                            };
                            this.fireFilterAttribute(oParam);
                        }, this ]
                    }) ]
                })
            }
        });
        var oSearch =
                new sap.m.SearchField({
                    placeholder : oTextBundle.getText("MM_Search_PHolder"),
                    showSearchButton : true,
                    liveChange : [
                            function(oEvent) {
                                // add filter for search
                                var sQuery = oEvent.getSource().getValue();
                                var oTable = oEvent.getSource().getParent().getParent().getItems()[1];
                                var oBinding = oTable.getBinding("items");
                                if (!sQuery) {
                                    oBinding.filter([]);
                                } else {
                                    oBinding.filter([ new sap.ui.model.Filter([ new sap.ui.model.Filter("displayName", sap.ui.model.FilterOperator.Contains, sQuery),
                                            new sap.ui.model.Filter("value", sap.ui.model.FilterOperator.Contains, sQuery) ], false) ]);
                                }
                            }, this ],
                });
        var oToolbar = new sap.m.Toolbar({
            content : [ oSearch, new sap.m.Button({
                icon : "sap-icon://add-product",
                tooltip : oTextBundle.getText("MM_TOL_Add2CF"),
                press : [ function(oEvent) {
                    var aData = this.getBinding("data").getContexts().map(function(oContext) {
                        return oContext.getObject();
                    });
                    var oCaseFileItem = {};
                    aData.forEach(function(oData) {
                        oCaseFileItem[oData.name] = oData.value;
                    });
                    if (!oCaseFileItem.Type) {
                        oCaseFileItem.Type = oCaseFileItem.Number ? sap.secmon.ui.malimon.Constants.C_TYPE.ALERT : sap.secmon.ui.malimon.Constants.C_TYPE.EVENT;
                    }
                    if (oCaseFileItem.Type === sap.secmon.ui.malimon.Constants.C_TYPE.ALERT) {
                        oCaseFileItem.EventSemantic = oCaseFileItem.EventName + " " + oCaseFileItem.Number;
                    }
                    this.fireAdd2CaseFile(oCaseFileItem);
                }, this ]
            }) ]
        });
        this._layout = new sap.m.VBox({
            items : [ oToolbar, oAttriTable ]
        });
        this.setAggregation("_layout", this._layout);
    },

    renderer : function(oRm, oControl) {
        oRm.write("<div");
        oRm.writeControlData(oControl);
        oRm.addStyle("width", oControl.getWidth());
        oRm.addStyle("height", oControl.getHeight());
        oRm.writeStyles();

        oRm.write(">");
        oRm.renderControl(oControl.getAggregation("_layout"));
        oRm.write("</div>");
    },

    onBeforeRendering : function() {
        // Add2Casefile Button
        var oButtonAdd2Casefile = this.getAggregation("_layout").getItems()[0].getContent()[1];
        if (oButtonAdd2Casefile) {
            oButtonAdd2Casefile.setEnabled(this.getShowAdd2CaseFile());
        } else {
            throw ("Button Add2CaseFile not found!");
        }
    }
});