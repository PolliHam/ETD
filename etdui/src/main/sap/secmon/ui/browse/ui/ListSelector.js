$.sap.declare("sap.secmon.ui.browse.ListSelector");

sap.ui.core.Control.extend("sap.secmon.ui.browse.ListSelector", {

    metadata : {
        properties : {
            height : {
                type : "sap.ui.core.CSSSize",
                defaultValue : "400px"
            },
            width : {
                type : "sap.ui.core.CSSSize",
                defaultValue : "600px"
            },
            availableItems : {
                type : "any",
                defaultValue : undefined
            },
            attachedItems : {
                type : "any",
                defaultValue : undefined
            },
        },

        aggregations : {
            _table : {
                type : "sap.ui.table.Table",
                multiple : false,
                visibility : "hidden"
            }
        },

        events : {
            // openLink : {
            // id : "string"
            // },
            create : {
                name : "string",
                fnSuccess : "string",
                fnFail : "string"
            },
            remove : {
                item : "any"
            },
            select : {
                item : "any"
            },
        }
    },

    oAvailableModel : new sap.ui.model.json.JSONModel(),
    oAttachedModel : new sap.ui.model.json.JSONModel(),

    setAvailableItems : function(aItems) {
        if (!aItems) {
            return;
        }
        this.setProperty("availableItems", aItems);
        this.oAvailableModel.setData(aItems);
    },

    setAttachedItems : function(aItems) {
        if (!aItems) {
            return;
        }
        this.setProperty("attachedItems", aItems);

        function isFound(aItem, sId) {
            var bFound = false;
            aItem.some(function(oItem, j) {
                if (oItem.id === sId) {
                    bFound = true;
                    return true;
                }
            });
            return bFound;
        }

        var aAttachedData = aItems;
        var aAvailableData = [];
        var aData = this.getAvailableItems();
        aData.forEach(function(oObj, i) {
            if (!isFound(aAttachedData, oObj.id)) {
                aAvailableData.push(oObj);
            }
        });

        this.oAttachedModel.setData(aAttachedData);
        this.oAvailableModel.setData(aAvailableData);
    },

    init : function() {
        var that = this;
        var oAvailableModel = this.oAvailableModel;

        var oToolbar = new sap.ui.commons.Toolbar({
            items : [ new sap.ui.commons.ComboBox({
                width : "200px",
                tooltip : "{i18n>BU_TIP_SelCrtSnapshot}",
                items : {
                    path : "/",
                    template : new sap.ui.core.ListItem({
                        key : "{id}",
                        text : "{name}",
                    })
                }
            }).setModel(oAvailableModel) ],
            rightItems : [ new sap.ui.commons.Button({
                text : "{i18n>BU_BUT_Select}",
                press : [ function(oEvent) {
                    // Add to table
                    var oComboBox = oEvent.getSource().getParent().getItems()[0];
                    var sName = oComboBox.getValue();

                    if (sName.length <= 0) {
                        return;
                    }

                    var aData = this.oAttachedModel.getData();

                    var oItem = {};
                    if (oComboBox.getSelectedKey().length > 0) {
                        // existing item
                        var oListItem = sap.ui.getCore().byId(oComboBox.getSelectedItemId());
                        oItem.id = oListItem.getKey();
                        oItem.name = oListItem.getText();
                        // remove from the model
                        var aAvailableData = oAvailableModel.getData();
                        var iFound = -1;
                        aAvailableData.some(function(oPage, i) {
                            if (oPage.id === oItem.id) {
                                iFound = i;
                                return true;
                            }
                        });
                        // copy item
                        var oFoundItem = JSON.parse(JSON.stringify(aAvailableData[iFound]));

                        aAvailableData.splice(iFound, 1);
                        oAvailableModel.setData(aAvailableData);
                        oComboBox.setValue("");

                        aData.splice(0, 0, oFoundItem);
                        this.oAttachedModel.setData(aData);

                        this.fireSelect({
                            item : oItem
                        });
                    } else {
                        // new item
                        oItem.name = sName;
                        this.fireCreate({
                            name : sName,
                            // this is passed into function
                            // {id, name, comments, ...}
                            fnSuccess : function() {
                                // oItem.id = this.id;
                                oItem = this;
                                aData.splice(0, 0, oItem);
                                that.oAttachedModel.setData(aData);

                                that.fireSelect({
                                    item : oItem
                                });
                            }
                        });
                    }

                }, this ]
            }) ]
        });

        var oTable = new sap.ui.table.Table({
            visibleRowCount : 3,
            width : "300px",
            columnHeaderVisible : false,
            selectionMode : sap.ui.table.SelectionMode.None,
            toolbar : oToolbar,
            rows : "{/}",
            columns : [ new sap.ui.table.Column({
                template : new sap.ui.core.Icon({
                    src : "sap-icon://decline",
                    tooltip : "{i18n>BU_TOL_DelSnapshot}",
                    press : [ function(oEvent) {
                        var iIdx = +oEvent.getSource().getParent().getBindingContext().getPath().split("/")[1];
                        var aAData = this.oAttachedModel.getData();

                        var oItem = aAData.splice(iIdx, 1)[0];
                        this.oAttachedModel.setData(aAData);
                        // add to the model
                        aAData = oAvailableModel.getData();
                        aAData.push(oItem);
                        oAvailableModel.setData(aAData);
                        this.fireRemove({
                            item : oItem
                        });
                    }, this ]
                }),
                width : "30px"
            }), new sap.ui.table.Column({
                template : new sap.ui.commons.Link({
                    text : "{name}",
                    href : "/sap/secmon/ui/snapshot/?Id={id}",
                    target : "_blank",
                    tooltip : {
                        path : "id",
                        formatter : function(sVal) {
                            var sId = sVal;
                            var sCreatedBy = "Not found";
                            var dCreatedAt;
                            if (sId) {
                                var formatJSONDate = function(sDate) {
                                    if (sDate) {
                                        /\/(.+)\//.exec(sDate);
                                        return eval('new ' + RegExp.$1);
                                    }
                                };
                                var aItems = that.getAvailableItems();
                                (aItems || []).some(function(oObj, i) {
                                    if (oObj.id === sId) {
                                        sCreatedBy = oObj.createdBy;
                                        dCreatedAt = formatJSONDate(oObj.createdAt);
                                        return true;
                                    }
                                });
                            }
                            return sCreatedBy + "/" + dCreatedAt;
                        }
                    },
                    press : [ function(oEvent) {
                    }, this ]
                })
            }) ]
        }).setModel(this.oAttachedModel);

        this.setAggregation("_table", oTable);
    },

    renderer : function(oRm, oControl) {
        oRm.write("<div align=\"bottom\">");
        oRm.renderControl(oControl.getAggregation("_table"));
        oRm.write("</div>");
    },

    // onBeforeRendering : function() {
    // // external model
    // var aAvailableData = [];
    // var aAttachedData = this.getAttachedItems();
    //
    // function isFound(aItem, sId) {
    // var bFound = false;
    // aItem.forEach(function(oItem, j) {
    // if (oItem.id == sId) {
    // bFound = true;
    // return false;
    // }
    // });
    // return bFound;
    // }
    //
    // var aData = this.getAvailableItems();
    // aData.forEach(function(oObj, i) {
    // if (!isFound(aAttachedData, oObj.id)) {
    // aAvailableData.push(oObj);
    // }
    // });
    //
    // this.oAttachedModel.setData(aAttachedData);
    // this.oAvailableModel.setData(aAvailableData);
    // },

    onAfterRendering : function() {
    }
});