jQuery.sap.require("sap.secmon.ui.commons.controls.LongTapLink");
jQuery.sap.declare("sap.secmon.ui.m.commons.controls.TextWithLinks");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/commons/controls/TextWithLinks.css");
sap.ui.core.Control.extend("sap.secmon.ui.m.commons.controls.TextWithLinks", {

    /**
     * Control is a Text with Links combined in one Textblock. Several Links are supported. are supported. Placeholders for the links are "{0},{1},...."
     */
    metadata : {
        properties : {
            text : {
                type : "string"
            },
            /**
             * <code>
             * links = [{ 
             *      text : <PatternName>,
             *      Url: <Url> },
             *      { 
             *      text : <PatternName2>,
             *      Url: <Url2> } ]
             * </code>
             */
            links : {
                type : "object[]",
                defaultValue : []
            }
        },
        aggregations : {
            _link : {
                type : "sap.secmon.ui.commons.controls.LongTapLink",
                multiple : false,
                visibility : "hidden"
            },
            _text : {
                type : "sap.m.Text",
                multiple : false,
                visibility : "hidden"
            },
        },
    },

    init : function() {
        if (sap.ui.core.Control.prototype.init) {
            sap.ui.core.Control.prototype.init.apply(this, arguments);
        }
        this.setAggregation("_text", new sap.m.Text(), true);
        this.setAggregation("_link", new sap.secmon.ui.commons.controls.LongTapLink(), true);
    },

    renderer : {
        render : function(oRM, oControl) {
            oRM.write("<div");
            oRM.writeControlData(oControl);
            oRM.write(">");
            var sText = oControl.getText() || "";
            var aText = sText.split(/\{\d{1,2}}/);
            var aLinks = oControl.getLinks();
            var linksavailable = aLinks && aLinks.length > 0;
            var aLinksSortOrder = [];

            while (linksavailable === true) {
                var pos = sText.search(/\{\d{1,2}/);
                var pos2 = sText.search(/}/);
                if (pos !== -1 && pos2 !== -1) {
                    var linkPos = +sText.slice(pos + 1, pos2);
                    aLinksSortOrder.push(linkPos);
                    sText = sText.substr(pos2 + 1);
                } else {
                    linksavailable = false;
                }
            }
            var oText = oControl.getAggregation("_text");
            oText.addStyleClass("ownText");
            var oLink = oControl.getAggregation("_link");
            oLink.addStyleClass("ownLink");
            aText.forEach(function(text, index) {
                oText.setText(text);
                oRM.renderControl(oText);
                if (index + 1 <= aLinks.length) {
                    if (aLinks[aLinksSortOrder[index]]) {
                        oLink.setText(aLinks[aLinksSortOrder[index]].Text);
                        oLink.setHref(aLinks[aLinksSortOrder[index]].Url);
                        oRM.renderControl(oLink);
                    }
                }
            });
            oRM.write("</div>");
        }
    },
});