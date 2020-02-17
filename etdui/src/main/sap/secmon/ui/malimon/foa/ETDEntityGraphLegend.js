$.sap.declare("sap.secmon.ui.malimon.foa.ETDEntityGraphLegend");

sap.ui.core.Control.extend("sap.secmon.ui.malimon.foa.ETDEntityGraphLegend", {

    metadata : {
        aggregations : {
            _verticalLayoutLegend : {
                type : "sap.ui.layout.VerticalLayout",
                multiple : false
            }
        }
    },

    init : function() {

        var oVerticalLayoutLegend = new sap.ui.layout.VerticalLayout();

        // oVerticalLayoutLegend.addContent(new sap.m.Label({
        // text : "Legend of Entities:",
        // design : sap.m.LabelDesign.Bold
        // }));

        var oConfigModel = sap.ui.getCore().getModel("ConfigModel");
        var aaEntities = oConfigModel.getProperty("/config/entities");

        for ( var sEntity in aaEntities) {
            if (aaEntities[sEntity].context === "Alert") {
                var type = aaEntities[sEntity].type;
                var iconSrc = this._getIconByType(type).iconSrc;
                var color = this._getIconByType(type).color;
                oVerticalLayoutLegend.addContent(new sap.m.FlexBox({
                    alignItems : "Center",
                    items : [ new sap.ui.core.Icon({
                        src : iconSrc,
                        color : color
                    }), new sap.m.Label({
                        text : "\u00a0" + "\u00a0" + aaEntities[sEntity].displayName,
                    }), ]
                }));
            }
        }

        this.setAggregation("_verticalLayoutLegend", oVerticalLayoutLegend);
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
        oRm.addClass('sapEtdEntityGraphLegend');
        oRm.writeClasses();
        oRm.write(">");
        oRm.renderControl(oControl.getAggregation("_verticalLayoutLegend"));
        oRm.write("</div>");
    },

    onAfterRendering : function() {

    }

});
