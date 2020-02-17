jQuery.sap.declare("sap.secmon.ui.commons.controls.LegendItemRenderer");

/**
 * Renderer for sap.secmon.ui.commons.controls.LegendItem.
 * 
 * @namespace
 */
sap.secmon.ui.commons.controls.LegendItemRenderer = {};

sap.secmon.ui.commons.controls.LegendItemRenderer.render = function(oRm, oControl) {

    if (oControl.getIsTitle()) {
        sap.secmon.ui.commons.controls.LegendItemRenderer._renderTitle(oRm, oControl);
    } else {
        sap.secmon.ui.commons.controls.LegendItemRenderer._renderTableRecord(oRm, oControl);
    }

};

sap.secmon.ui.commons.controls.LegendItemRenderer._renderTitle = function(oRm, oControl) {
    oRm.write("<th");
    oRm.writeControlData(oControl);
    oRm.writeAttribute("colspan", "2");
    oRm.addStyle("font-size", "14px");
    oRm.addStyle("padding-top", "10px");
    oRm.addStyle("padding-bottom", "10px");
    oRm.addStyle("cursor", "default");
    oRm.addStyle("text-align", "left");
    oRm.writeStyles();
    oRm.writeClasses();
    oRm.write(">");

    oRm.writeEscaped(oControl.getText());

    oRm.write("</th>");
};

sap.secmon.ui.commons.controls.LegendItemRenderer._renderTableRecord = function(oRm, oControl) {
    oRm.write("<tr");
    oRm.writeControlData(oControl);
    oRm.writeAttribute("tabindex", "-1");
    oRm.addStyle("line-height", "16px");
    // remove the focus glow when clicking in the area:
    oRm.addStyle("outline", "none");
    oRm.writeStyles();
    oRm.writeClasses();
    oRm.write(">");

    if (oControl.getIcon()) {
        oRm.write("<td");
        oRm.addStyle("width", "15px");
        oRm.writeStyles();
        oRm.write(">");
        oRm.renderControl(oControl.getIcon());
        oRm.write("</td>");
    }

    oRm.write("<td");

    if (!oControl.getIcon()) {
        // if no icon given, render text in full width
        oRm.writeAttribute("colspan", "2");
    }

    oRm.addStyle("font-size", "13px");
    oRm.addStyle("cursor", "default");
    oRm.addStyle("white-space", "normal");
    oRm.addStyle("word-break", "keep-all");
    oRm.writeStyles();
    oRm.write(">");

    if (oControl.getText()) {
        oRm.writeEscaped(oControl.getText());
    }
    oRm.write("</td>");

    oRm.write("</tr>");
};