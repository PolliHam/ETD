jQuery.sap.declare("sap.secmon.ui.commons.controls.LegendIconRenderer");

/**
 * Renderer for sap.secmon.ui.commons.controls.LegendIcon.
 * 
 * @namespace
 */
sap.secmon.ui.commons.controls.LegendIconRenderer = {};

sap.secmon.ui.commons.controls.LegendIconRenderer.render = function(oRm, oControl) {

    if (typeof oControl.getSrc() === "string") {
        sap.secmon.ui.commons.controls.LegendIconRenderer._renderSapIcon(oRm, oControl);
    } else if (oControl.getType() === "circle") {
        sap.secmon.ui.commons.controls.LegendIconRenderer._renderCircle(oRm, oControl);
    } else if (oControl.getType() === "rectangle") {
        sap.secmon.ui.commons.controls.LegendIconRenderer._renderRectangle(oRm, oControl);
    } else if (oControl.getType() === "triangle") {
        sap.secmon.ui.commons.controls.LegendIconRenderer._renderTriangle(oRm, oControl);
    } else if (oControl.getType() === "plus") {
        sap.secmon.ui.commons.controls.LegendIconRenderer._renderPlus(oRm, oControl);
    } else if (oControl.getType() === "cross") {
        sap.secmon.ui.commons.controls.LegendIconRenderer._renderCross(oRm, oControl);
    }
};

sap.secmon.ui.commons.controls.LegendIconRenderer._renderCircle = function(oRm, oControl) {
    oRm.write("<div");
    oRm.writeControlData(oControl);
    oRm.addClass("sapEtdLegendCircle");
    oRm.addStyle("background", oControl.getColor());
    oRm.writeStyles();
    oRm.writeClasses();
    oRm.write(">");
    oRm.write("</div>");
};

sap.secmon.ui.commons.controls.LegendIconRenderer._renderRectangle = function(oRm, oControl) {
    oRm.write("<div");
    oRm.writeControlData(oControl);
    oRm.addClass("sapEtdLegendRectangle");
    oRm.addStyle("background", oControl.getColor());
    oRm.writeStyles();
    oRm.writeClasses();
    oRm.write(">");
    oRm.write("</div>");
};

sap.secmon.ui.commons.controls.LegendIconRenderer._renderTriangle = function(oRm, oControl) {
    oRm.write("<div");
    oRm.writeControlData(oControl);
    oRm.addClass("sapEtdLegendTriangle");
    oRm.addStyle("border-bottom-color", oControl.getColor());
    oRm.writeStyles();
    oRm.writeClasses();
    oRm.write(">");
    oRm.write("</div>");
};

sap.secmon.ui.commons.controls.LegendIconRenderer._renderSapIcon = function(oRm, oControl) {
    oRm.write("<div");
    oRm.writeControlData(oControl);
    oRm.addStyle("color", oControl.getColor());
    oRm.writeStyles();
    oRm.writeClasses();
    oRm.write(">");

    if (jQuery.sap.startsWith(oControl.getSrc(), "sap-icon://")) {
        oRm.writeIcon(oControl.getSrc());
    } else {
        oRm.writeIcon(oControl.getSrc(), {}, {
            width : oControl.getWidth(),
            height : oControl.getHeight()
        });
    }
    oRm.write("</div>");
};

sap.secmon.ui.commons.controls.LegendIconRenderer._renderPlus = function(oRm, oControl) {
    oRm.write("<div");
    oRm.writeControlData(oControl);
    oRm.addClass("sapEtdLegendPlus");
    oRm.addStyle("background", oControl.getColor());
    oRm.writeStyles();
    oRm.writeClasses();
    oRm.write(">");
    oRm.write("</div>");
};

sap.secmon.ui.commons.controls.LegendIconRenderer._renderCross = function(oRm, oControl) {
    oRm.write("<div");
    oRm.writeControlData(oControl);
    oRm.addClass("sapEtdLegendCross");
    oRm.addStyle("color", oControl.getColor());
    oRm.writeStyles();
    oRm.writeClasses();
    oRm.write(">");

    oRm.write("<span>");
    oRm.write("X");
    oRm.write("</span>");

    oRm.write("</div>");
};