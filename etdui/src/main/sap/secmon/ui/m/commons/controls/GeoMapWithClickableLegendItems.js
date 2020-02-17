jQuery.sap.declare("sap.secmon.ui.m.commons.controls.GeoMapWithClickableLegendItems");

jQuery.sap.require("sap.ui.vbm.LegendItem");

/**
 * this GeoMap enhances each its legend with clickable legend items. These are
 * not available yet in SAPUI5 1.28. This class is obsolete in later releases.
 */

(function() {

    sap.ui.vbm.GeoMap.extend("sap.secmon.ui.m.commons.controls.GeoMapWithClickableLegendItems", {
        // metadata : {
        // events : {
        // legendItemPress : {}
        // }
        // },

        renderer : function(oRm, oControl) {
            sap.ui.vbm.GeoMapRenderer.render(oRm, oControl);
        },

        onAfterRendering : function() {
            sap.ui.vbm.GeoMap.prototype.onAfterRendering.apply(this, arguments);
            var legend = this.getLegend();
            if (!legend) {
                return;
            }

            var aItems = legend.getItems();
            if (!aItems || aItems.length === 0) {
                return;
            }

            // Find table cells that look like:
            // <td class="vbi-legend-content-celltext"
            // id="__xmlview2--vbi-__xmlview2--legend-table-content-celltext-0">YI3
            // (17)</td>
            var $cells = $(this.getDomRef()).find("td[class='vbi-legend-content-celltext']");

            $cells.each(function(index, cell) {

                // find SAPUI5 element which matches DOM element
                var aFoundItems = aItems.filter(function(item) {
                    var text = item.getText();
                    return text === cell.innerText;
                });
                var item = aFoundItems[0];
                if (!item) {
                    return;
                }
                if (item instanceof sap.secmon.ui.m.commons.controls.VbmLegendItem) {
                    var $cell = $(cell);

                    $cell.css('cursor', 'pointer');

                    $cell[0].addEventListener("click", function() {
                        item.fireClick();
                    }.bind(this), true);
                }
            }.bind(this));
        }
    });

})();
