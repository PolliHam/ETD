/* globals oTextBundle */
$.sap.declare("sap.secmon.ui.malimon.foa.ETDEntityGraphFilter");
// $.sap.require("sap.secmon.ui.browse.MultiInput");

sap.ui.core.Control.extend("sap.secmon.ui.malimon.foa.ETDEntityGraphFilter", {

    metadata : {
        properties : {},
        aggregations : {
            control : {
                type : "sap.ui.core.Control",
                multiple : false,
                visibility : "hidden"
            },
        // _verticalLayoutTop10 : {
        // type : "sap.ui.layout.VerticalLayout",
        // multiple : false
        // }
        },
        events : {
            tokenPressed : {
                parameters : {
                    sNodeId : {
                        type : "string"
                    }
                }
            },
            top10SelectionChanged : {}
        }
    },

    // init : function() {
    //    
    // var oVerticalLayoutTop10 = new sap.ui.layout.VerticalLayout({
    // height : "100%",
    // width : "100%"
    // });
    //
    // // /*------------------ Top 10 --------------*/
    // // oVerticalLayoutTop10.addContent(new sap.m.CheckBox({
    // // // TODO: add entity of attention dynamically depending on focus
    // // text : "Top 10", // + entity of attention
    // // design : sap.m.LabelDesign.Bold,
    // // selected : "{Top10Model>/bShowTop10}",
    // // select : [ function(oEvent) {
    // // this.fireEvent("top10SelectionChanged", {});
    // // }, this ]
    // // }));
    //
    // TODO: use sap.m.MultiComboBox?
    // var oTop10Model = sap.ui.getCore().getModel("Top10Model");
    // oVerticalLayoutTop10.addContent(new sap.secmon.ui.browse.MultiInput({
    // enableMultiLineMode : true,
    // tokens : {
    // path : "Top10Model>/selected",
    // template : new sap.m.Token({
    // text : {
    // parts : [ {
    // path : "Top10Model>name"
    // }, {
    // path : "Top10Model>alertsCnt"
    // } ],
    // formatter : function(sName, sAlertsCnt) {
    // return sName + "(" + sAlertsCnt + ")";
    // }
    // },
    // key : "{Top10Model>id}",
    // press : [ function(oEvent) {
    // this.fireEvent("tokenPressed", {
    // sNodeId : oEvent.getParameters().token.getKey()
    // });
    // }, this ],
    // "delete" : [ function(oEvent) {
    // var aSelected = oTop10Model.getProperty("/selected");
    // var oToken = oEvent.getSource();
    // for (var i = aSelected.length; i--;) {
    // if (aSelected[i].id === oToken.getKey()) {
    // aSelected.splice(i, 1);
    // // oTop10Model.setProperty("/selected", aSelected);
    // this.fireEvent("top10SelectionChanged", {});
    // }
    // }
    // }, this ]
    // }),
    // },
    // suggestionItems : {
    // path : "Top10Model>/all",
    // template : new sap.ui.core.Item({
    // key : "{Top10Model>id}",
    // text : {
    // parts : [ {
    // path : "Top10Model>name"
    // }, {
    // path : "Top10Model>alertsCnt"
    // } ],
    // formatter : function(sName, sAlertsCnt) {
    // return sName + "(" + sAlertsCnt + ")";
    // }
    // }
    // })
    // },
    // valueHelpUpdated : [ function(oEvent) {
    // var aSelected = [];
    // oEvent.getParameter("selectedItems").forEach(function(oItem) {
    // var aParts = oItem.text.split("(");
    // var sName = aParts[0];
    // var sAlertsCnt = aParts[1].split(")")[0];
    // aSelected.push({
    // id : oItem.key,
    // name : sName,
    // alertsCnt : sAlertsCnt
    // });
    //
    // });
    // oTop10Model.setProperty("/selected", aSelected);
    // oTop10Model.refresh(true);
    // this.fireEvent("top10SelectionChanged", {});
    // }, this ],
    // suggestionItemSelected : [ function(oEvent) {
    // var aSelected = oTop10Model.getProperty("/selected");
    // var oToken = oEvent.getParameter("selectedItem");
    // // do not insert if already in the array
    // for (var i = 0; i < aSelected.length; i++) {
    // if (aSelected[i].id === oToken.getKey())
    // return;
    // }
    // var aParts = oToken.getText().split("(");
    // var sName = aParts[0];
    // var sAlertsCnt = aParts[1].split(")")[0];
    // aSelected.push({
    // id : oToken.getKey(),
    // name : sName,
    // alertsCnt : sAlertsCnt
    // });
    // // oTop10Model.setProperty("/selected", aSelected);
    // this.fireEvent("top10SelectionChanged", {});
    // }, this ],
    // }).addStyleClass("sapEtdEntityGraphTop10Multi"));
    //    
    // this.setAggregation("_verticalLayoutTop10", oVerticalLayoutTop10);
    // },
    init : function() {

        var oTop10Model = sap.ui.getCore().getModel("Top10Model");
        var oFilterTabel = new sap.m.Table({
            width : document.documentElement.clientWidth * 1 / 5 + "px",
            height : document.documentElement.clientHeight * 1 / 5 + "px",
            mode : "MultiSelect",
            columns : [ new sap.m.Column({
                header : new sap.m.Label({
                    text : ""
                })
            }), new sap.m.Column({
                header : new sap.m.Label({
                    text : oTextBundle.getText("MM_LBL_AlertsCount"),
                })
            }) ],
            items : {
                path : "Top10Model>/all",
                template : new sap.m.ColumnListItem({
                    cells : [ new sap.m.Text({
                        text : "{Top10Model>name}"
                    }), new sap.m.ObjectNumber({
                        number : "{Top10Model>alertsCnt}"
                    }) ]
                })
            },
            selectionChange : [ function(oEvent) {
                var aSelectedItems = oEvent.getSource().getSelectedItems();
                var aSelected = [];
                aSelectedItems.forEach(function(oSelectedItem) {
                    aSelected.push({
                        id : oTop10Model.getProperty(oSelectedItem.oBindingContexts.Top10Model.sPath + "/id"),
                        name : oTop10Model.getProperty(oSelectedItem.oBindingContexts.Top10Model.sPath + "/name"),
                        alertsCnt : oTop10Model.getProperty(oSelectedItem.oBindingContexts.Top10Model.sPath + "/alertsCnt")
                    });
                });
                oTop10Model.setProperty("/selected", aSelected);
                this.fireEvent("top10SelectionChanged", {});
            }, this ]
        });
        // }).addStyleClass("sapEtdEntityGraphTop10Multi");

        // VBox with table and toolbar
        var vbox = new sap.m.VBox({
            items : [ new sap.m.Toolbar({
                content : [ new sap.m.SearchField({
                    placeholder : oTextBundle.getText("MM_FOE_Placeholder"),
                    liveChange : function(oEvent) {
                        // add filter for search
                        var sQuery = oEvent.getSource().getValue();
                        var oTable = oEvent.getSource().oParent.oParent.getItems()[1];
                        var binding = oTable.getBinding("items");
                        if (!sQuery) {
                            binding.filter([]);
                        } else {
                            binding.filter([ new sap.ui.model.Filter([ new sap.ui.model.Filter("name", sap.ui.model.FilterOperator.Contains, sQuery) ], false) ]);
                        }
                    }
                }) ]
            }), oFilterTabel ]
        });
        this.setAggregation("control", vbox);
    },
    exit : function() {
    },

    renderer : function(oRm, oControl) {
        oRm.write("<div");
        oRm.writeControlData(oControl);
        oRm.addClass('sapEtdEntityGraphFilter');
        oRm.writeClasses();
        oRm.write(">");
        oRm.renderControl(oControl.getAggregation("control"));
        oRm.write("</div>");
    },

    onAfterRendering : function() {

    }
});
