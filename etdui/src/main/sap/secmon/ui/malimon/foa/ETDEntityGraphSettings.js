/* globals oTextBundle */
$.sap.declare("sap.secmon.ui.malimon.foa.ETDEntityGraphSettings");
$.sap.require("sap.secmon.ui.browse.Constants");
$.sap.require("sap.secmon.ui.browse.TimeRange");

sap.ui.core.Control.extend("sap.secmon.ui.malimon.foa.ETDEntityGraphSettings", {

    metadata : {
        properties : {
            TRType : {
                type : "string",
                defaultValue : "Relative"
            },
            TRValue : {
                type : "object",
                defaultValue : {
                    relativeValue : "last15Minutes",
                    showUTC : true
                }
            },
            Top : {
                type : "string",
                defaultValue : "20"
            },
            Focus : {
                type : "string",
                defaultValue : "User"
            },
            GraphDims : {
                type : "object[]",
                defaultValue : []
            }
        },
        aggregations : {
            _verticalLayoutSettings : {
                type : "sap.ui.layout.VerticalLayout",
                multiple : false
            }
        }
    },

    _oTimeRange : undefined,
    _oTopChB : undefined,
    _oTopInput : undefined,
    _oFocusRGrp : undefined,
    _aEntitiesOfAttention : [],

    setTRType : function(sValue) {
        this.setProperty("TRType", sValue, true);
        this._oTimeRange.setType(sValue);
    },

    setTRValue : function(oValue) {
        this.setProperty("TRValue", oValue, true);
        this._oTimeRange.setValue(oValue);
    },

    setTop : function(sValue) {
        this.setProperty("Top", sValue, true);
        this._oTopInput.setValue(sValue);
        if (sValue && parseInt(sValue)) {
            this._oTopChB.setSelected(true);
            this._oTopInput.setEnabled(true);
        } else {
            this._oTopChB.setSelected(false);
            this._oTopInput.setEnabled(false);
        }
    },

    getTop : function() {
        if (this._oTopChB) {
            if (this._oTopChB.getSelected()) {
                return this.getProperty("Top");
            } else {
                return "0";
            }
        }
    },

    setFocus : function(sValue) {
        this.setProperty("Focus", sValue, true);
        var oConfigModel = sap.ui.getCore().getModel("ConfigModel");
        var aGraphFocus = oConfigModel.getProperty("/config/focus");
        var iIdx = aGraphFocus.map(function(x) {
            return x.name;
        }).indexOf(sValue);
        this._oFocusRGrp.setSelectedIndex(iIdx);
        // get the required dimensions for focus from config.json
        // and set them to property GraphDims
        var aNewDims = [];
        aGraphFocus[iIdx].dimensions.forEach(function(oDim, i) {
            if (oDim.key !== "0001" && oDim.required) {
                aNewDims.push(oDim);
            }
        });
        this.setGraphDims(aNewDims);
    },

    getFocusSelectedIndex : function() {
        var oConfigModel = sap.ui.getCore().getModel("ConfigModel");
        var aGraphFocus = oConfigModel.getProperty("/config/focus");
        return aGraphFocus.map(function(x) {
            return x.name;
        }).indexOf(this.getFocus());
    },

    setGraphDims : function(aValue) {
        this.setProperty("GraphDims", aValue.slice(0), true);
        // set the checkboxes->selected=true for the given dimensions
        // set the checkboxes->enabled/disabled in accordance to config.json
        var aaGraphDims = {};
        this.getGraphDims().forEach(function(oGraphDim, i) {
            aaGraphDims[oGraphDim.key] = oGraphDim;
        });

        var oConfigModel = sap.ui.getCore().getModel("ConfigModel");
        var aGraphFocus = oConfigModel.getProperty("/config/focus");
        var aaMetaDimInfo = {};
        var iSelecIndex = this.getFocusSelectedIndex();
        aGraphFocus[iSelecIndex].dimensions.forEach(function(oDim, i) {
            aaMetaDimInfo[oDim.key] = oDim;
        });

        var currentFocus = this.getFocus();
        this._aEntitiesOfAttention.forEach(function(oEntityOfAttention) {
            if (oEntityOfAttention.getMetadata().getName() === "sap.m.FlexBox") {
                var oCheckBox = oEntityOfAttention.getItems()[1];
                if (oCheckBox.getMetadata().getName() === "sap.m.CheckBox") {
                    if (aaGraphDims.hasOwnProperty(oCheckBox.data().dimension.key)) {
                        oCheckBox.setSelected(true);
                    } else {
                        oCheckBox.setSelected(false);
                    }
                    if (aaMetaDimInfo.hasOwnProperty(oCheckBox.data().dimension.key)) {
                        var oMetaDimInfo = aaMetaDimInfo[oCheckBox.data().dimension.key];
                        if (oMetaDimInfo) {
                            if (currentFocus === "Pattern" && oMetaDimInfo.displayName === "Network, Hostname, Initiator") {
                                oCheckBox.setEnabled(false);
                            } else {
                                oCheckBox.setEnabled(!oMetaDimInfo.required);
                            }
                        } else {
                            oCheckBox.setEnabled(false);
                        }
                    }
                    if (oCheckBox.getText() === "Investigation") {
                        oCheckBox.setSelected(true);
                        oCheckBox.setEnabled(false);
                    }
                }
            }
        });
    },

    getExtraGraphDims : function() {
        var aExtraDims = [];
        this._aEntitiesOfAttention.forEach(function(oEntityOfAttention) {
            if (oEntityOfAttention.getMetadata().getName() === "sap.m.FlexBox") {
                var oCheckBox = oEntityOfAttention.getItems()[1];
                if (oCheckBox.getMetadata().getName() === "sap.m.CheckBox") {
                    if (oCheckBox.getSelected() && oCheckBox.getEnabled()) {
                        aExtraDims.push(oCheckBox.data().dimension.key);
                    }
                }
            }
        });
        return aExtraDims;
    },

    init : function() {
        var oConfigModel = sap.ui.getCore().getModel("ConfigModel");
        var aaEntities = oConfigModel.getProperty("/config/entities");

        var oVerticalLayoutSettings = new sap.ui.layout.VerticalLayout();
        /*------------------ Time of Attention --------------*/
        oVerticalLayoutSettings.addContent(new sap.m.Label({
            text : oTextBundle.getText("MM_TIT_TimeOfAttent"),
            design : sap.m.LabelDesign.Bold
        }));
        this._oTimeRange = new sap.secmon.ui.browse.TimeRange({
            type : this.getTRType(),
            value : this.getTRValue(),
            relativeIntervals : {
                path : "TimeRangeModel>/",
                template : new sap.ui.base.ManagedObject(),
                templateShareable : false
            },
            change : [ function(oEvent) {
                var TR = oEvent.getSource();
                this.setTRType(TR.getType());
                this.setTRValue(TR.getValue());
            }, this ]
        });
        oVerticalLayoutSettings.addContent(this._oTimeRange);

        /*------------------ Top N --------------*/
        this._oTopChB = new sap.m.CheckBox({
            text : oTextBundle.getText("MM_TIT_ShowTopN"),
            selected : this.getTop(),
            design : sap.m.LabelDesign.Bold,
            select : [ function(oEvent) {
                if (oEvent.getParameter("selected")) {
                    this._oTopInput.setEnabled(true);
                } else {
                    this._oTopInput.setEnabled(false);
                }
            }, this ]
        });
        this._oTopInput = new sap.m.Input({
            type : sap.m.InputType.Number,
            value : this.getTop(),
            liveChange : [ function(oEvent) {
                var newValue = oEvent.getParameter("value");
                this.setTop(newValue);
            }, this ]
        });

        oVerticalLayoutSettings.addContent(new sap.ui.layout.HorizontalLayout({
            content : [ this._oTopChB, this._oTopInput ]
        }));

        /*------------------ Focus of Attention --------------*/
        oVerticalLayoutSettings.addContent(new sap.m.Label({
            text : oTextBundle.getText("MM_TIT_FocusOfAttent"),
            design : sap.m.LabelDesign.Bold
        }));

        this._oFocusRGrp = new sap.m.RadioButtonGroup({
            select : [ function(oEvent) {
                var iSelectedIndex = oEvent.getParameter("selectedIndex");
                var oConfigModel = sap.ui.getCore().getModel("ConfigModel");
                var aGraphFocus = oConfigModel.getProperty("/config/focus");
                this.setFocus(oTextBundle.getText(aGraphFocus[iSelectedIndex].tid));
            }, this ],
            selectedIndex : this.getFocusSelectedIndex(),
            buttons : {
                path : "ConfigModel>/config/focus",
                template : new sap.m.RadioButton({
                    // text : "{ConfigModel>name}"
                    text : {
                        path : "ConfigModel>tid",
                        formatter : function(tid) {
                            return oTextBundle.getText(tid);
                        }
                    }
                })
            }
        });
        oVerticalLayoutSettings.addContent(this._oFocusRGrp);

        /*------------------ Entities of Attention --------------*/
        oVerticalLayoutSettings.addContent(new sap.m.Label({
            text : oTextBundle.getText("MM_TIT_EntityOfAttent"),
            design : sap.m.LabelDesign.Bold
        }));
        // TODO: sContext => hard-coded "Alert"
        this._aEntitiesOfAttention = [];
        for ( var sEntity in aaEntities) {
            if (aaEntities[sEntity].context === "Alert") {
                var type = aaEntities[sEntity].type;
                var iconSrc = this._getIconByType(type).iconSrc;
                this._aEntitiesOfAttention.push(new sap.m.FlexBox({
                    alignItems : sap.m.FlexAlignItems.Center,
                    items : [ new sap.ui.core.Icon({
                        src : iconSrc,
                        width : "18px"
                    }), new sap.m.CheckBox({
                        text : aaEntities[sEntity].displayName,
                        name : sEntity,
                        selected : true,
                        select : [ function(oEvent) {
                            var oChB = oEvent.getSource();
                            var aGraphDims = this.getGraphDims();
                            if (oEvent.getParameters().selected) {
                                aGraphDims.push($.extend(true, {}, oChB.data().dimension));
                            } else {
                                for (var i = aGraphDims.length; i--;) {
                                    if (aGraphDims[i].key === oChB.data().dimension.key) {
                                        aGraphDims.splice(i, 1);
                                    }
                                }
                            }
                            this.setGraphDims(aGraphDims);
                        }, this ]
                    }).data("dimension", {
                        key : sEntity,
                        name : aaEntities[sEntity].fieldName,
                        displayName : aaEntities[sEntity].displayName,
                        context : aaEntities[sEntity].context
                    }), ]
                }));
            }
        }
        this._aEntitiesOfAttention.forEach(function(oEntityOfAttention) {
            oVerticalLayoutSettings.addContent(oEntityOfAttention);
        });
        this.setAggregation("_verticalLayoutSettings", oVerticalLayoutSettings);
    },

    _getIconByType : function(type) {
        var oConfigModel = sap.ui.getCore().getModel("ConfigModel");
        var aaDisplaySettings = oConfigModel.getProperty("/config/displaySettings");
        if (aaDisplaySettings[type]) {
            return aaDisplaySettings[type];
        }
    },

    exit : function() {
    },

    renderer : function(oRm, oControl) {
        oRm.write("<div");
        oRm.writeControlData(oControl);
        oRm.addClass('sapEtdEntityGraphSettings');
        oRm.writeClasses();
        oRm.write(">");
        oRm.renderControl(oControl.getAggregation("_verticalLayoutSettings"));
        oRm.write("</div>");
    },

    onAfterRendering : function() {

    }

});
