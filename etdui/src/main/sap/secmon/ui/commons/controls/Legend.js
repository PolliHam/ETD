jQuery.sap.declare("sap.secmon.ui.commons.controls.Legend");
jQuery.sap.require("sap.secmon.ui.commons.controls.LegendItem");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/commons/controls/css/Legend.css");

/**
 * Constructor for a new Legend.
 * 
 * @param {sap.secmon.ui.commons.controls.LegendItem[]}
 *            items - The LegendItems to show within this legend.
 * 
 * Default value: []
 * 
 * @class
 */
sap.ui.core.Control.extend("sap.secmon.ui.commons.controls.Legend", {
    metadata : {

        aggregations : {
            items : {
                type : "sap.secmon.ui.commons.controls.LegendItem",
                singularName : "item",
                multiple : true
            }
        },

        defaultAggregation : "items"

    }
});
