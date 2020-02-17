sap.ui.define([
    "sap/ui/core/Control",
    "sap/ui/core/Icon"

], function (Control, Icon) {
    "use strict";
    return Control.extend("sap.secmon.ui.m.commons.controls.SortableItem", {
        metadata : {
            properties : {
                text : {type : "any", defaultValue : ""},
                icon : {type : "any", defaultValue : ""}
            },
            aggregations : {
                _icon : {type : "sap.ui.core.Icon", multiple: false, visibility : "hidden"}
            }
        },
        init : function () {
            this.setAggregation("_icon", new Icon({
                src: ""
            }));
        },

        setText: function (sText) {
            this.setProperty("text", sText, true);
        },

        setIcon: function (icon) {
            this.getAggregation("_icon").setSrc(icon);

            this.setProperty("icon", icon);
        },

        renderer : function (oRM, oControl) {
            oRM.write("<div style='pointer: cursor' ");
            oRM.writeControlData(oControl);
            oRM.addClass("clickableColumnItem");
            oRM.writeClasses();
            oRM.write(">");
            oRM.write("<span style='width: 90%; pointer: cursor; word-wrap: break-word; white-space: pre-line' class='clickableColumnItem sapMLabel sapMLabelTBHeader'>");
            oRM.write(oControl.getProperty("text"));
            oRM.write("</span>");
            oRM.renderControl(oControl.getAggregation("_icon"));
            oRM.write("</div>");
        }
    });
});