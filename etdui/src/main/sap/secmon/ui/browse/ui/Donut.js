/* globals oTextBundle, d3 */
$.sap.declare("sap.secmon.ui.browse.Donut");

$.sap.require("sap.viz.ui5.types.legend.Common");
$.sap.require("sap.secmon.ui.browse.Constants");
$.sap.require("sap.secmon.ui.browse.Donut-d3");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/browse/ui/donut.css");

/**
 * Custom control to provide a visual representation of data distribution in one dimension, similar to the Pie chart of Viz
 * 
 * It reuses the d3 implementation of Donut: Donut-d3.js
 * 
 * @todo: use sap.ui5.viz.BaseChart as parent class
 * @see: sap.ui5.viz.pieChart
 */

sap.ui.core.Control.extend("sap.secmon.ui.browse.Donut", {

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

            radius : {
                type : "int",
                defaultValue : 100
            },

            innerRadius : {
                type : "int",
                defaultValue : 40
            },

            dataset : {
                type : "any"
            },

            interaction : {
                // type : sap.viz.ui5.types.controller.Interaction
                type : "object"
            },

            legend : {
                type : "object"
            },

            showLegend : {
                type : "boolean",
                defaultValue : false
            },

            title : {
                type : "object"
            // type : "sap.viz.ui5.types.Title"
            }

        },

        aggregations : {},

        events : {
            select : {
                selectedData : "any"
            },
            deselect : {
                selectedData : "any"
            },
        }
    },

    _dataSelected : [],
    _useStatusColor : undefined,
    _donut : undefined,

    selection : function(cfg) {
        if (cfg) {
            return this._dataSelected;
        } else {
            this._dataSelected = [];
        }
    },

    init : function() {

        this._donut = sap.secmon.ui.browse["Donut-d3"].donut().useStatusColor(false);

        this._dataSelected.length = 0;
        this._useStatusColor = false;
    },

    exit : function() {
        delete this._donut;
        delete this._data;
    },

    // TODO:
    _dataSelectHandler : undefined,

    destroyDataset : function() {
        var oDataset = this.getDataset();
        if (oDataset) {
            // oDataset.unbindData();
            oDataset.destroyDimensions();
            oDataset.destroyMeasures();
            // oDataset.destroyData();
        }
        return this;
    },

    attachSelectData : function(fnClickHandler) {
        this._dataSelectHandler = fnClickHandler;
    },

    renderer : function(oRm, oControl) {
        oRm.write("<div");
        oRm.addClass('sapEtdDonutContainer');
        oRm.writeClasses();
        oRm.writeControlData(oControl);
        oRm.write(">");

        oRm.write("<div");
        oRm.write(" id=" + "'" + oControl.getId() + "_Content" + "'");
        oRm.addClass('sapEtdDonut');
        oRm.writeClasses();
        oRm.write(">");
        oRm.write("</div>");

        function _getHeightInPixel(roControl) {
            var sHeight;

            if (!roControl) {
                return isNaN(window.innerHeight) ? window.clientHeight : window.innerHeight;
            }

            if (roControl.getHeight) {
                sHeight = roControl.getHeight();
            }

            if (!sHeight || sHeight.length <= 0 || sHeight.indexOf("px") < 0) {
                if (roControl.getDomRef && roControl.getDomRef() && roControl.getDomRef().style) {
                    sHeight = roControl.getDomRef().style.height;
                }
            }

            return !sHeight || sHeight.indexOf("%") > 0 ? undefined : sHeight;
        }

        function _getPaddingInPixel(roControl) {
            var iPadding = 0;
            try {
                var oDomRef = roControl.getDomRef();

                if (oDomRef && oDomRef.style) {
                    iPadding = oDomRef.style.top ? parseInt(oDomRef.style.top) : 0 + oDomRef.style.buttom ? parseInt(oDomRef.style.buttom) : 0;
                }
            } catch (e) {
            }

            return iPadding;
        }

        function _findHeight(roControl, iPadding) {
            var sHeight = _getHeightInPixel(roControl);
            iPadding += _getPaddingInPixel(roControl);

            if (!sHeight) {
                return _findHeight(roControl.getParent(), iPadding);
            } else {
                return parseInt(sHeight) - iPadding;
            }
        }

        var sHeight = _findHeight(oControl, 0);

        // if (oControl.getShowLegend()) {
        oRm.write("<div");
        oRm.write(" id=" + "'" + oControl.getId() + "_Legend" + "'");
        oRm.addClass('sapEtdDonutLegend');
        oRm.writeClasses();
        oRm.write(">");
        oRm.write("</div>");
        // }

        oRm.write("</div>");
    },

    onBeforeRendering : function() {

        // handle the data updating
        var oBindingPath = this.getDataset().getBindingPath("data");
        this.getModel().bindList(oBindingPath).attachChange(function() {
            if (!d3.select(".sapEtdDonut").empty()) { // call only after renderer has been called!
                this.onAfterRendering();
            }
        }, this);
        this._aFlattenedData = this.getModel().getProperty(oBindingPath);
    },

    _svg : undefined,
    _data : undefined,

    // TODO
    _colors : d3.scale.ordinal().range(
            [ '#748CB2', '#9CC677', '#EACF5E', '#F9AD79', '#D16A7C', '#8873A2', '#3A95B3', '#B6D949', '#FDD36C', '#F47958', '#A65084', '#0063B1', '#0DA841', '#FCB71D', '#F05620', '#B22D6E',
                    '#3C368E', '#8FB2CF', '#95D4AB', '#EAE98F', '#F9BE92', '#EC9A99', '#BC98BD', '#1EB7B2', '#73C03C', '#F48323', '#EB271B', '#D9B5CA', '#AED1DA', '#DFECB2', '#FCDAB0', '#F5BCB4' ]),

    // Define 'div' for tooltips
    _d3Tooltip : undefined,

    _prepareData : function() {

        var that = this;

        this._data = [];
        if (this.getModel()) {
            var C_KB_HEALTH_CHECK_STATUS = '55B7BB94849E895AE24B192DA65BB37B';
            var aKeys = [], sKey, oKeyMap = {};
            this.getDataset().getDimensions().forEach(function(oDim, iIdx) {
                sKey = oDim.getBindingPath("value");
                aKeys.push(sKey);
                // map keys to names
                oKeyMap[sKey] = oDim.getName();
                // use status colors red, green, yellow in case of status field,
                // identified with KB ID = 55B7BB94849E895AE24B192DA65BB37B,
                // currently only used for Health Check
                if (sKey === C_KB_HEALTH_CHECK_STATUS) {
                    that._useStatusColor = true;
                }
            });

            var sVal = this.getDataset().getMeasures()[0].getBindingPath("value");
            $.each(this._aFlattenedData || [], function(i, oFlattenedData) {
                var sId = "", aDims = [];
                aKeys.forEach(function(sKey, i) {
                    if (i !== 0) {
                        sId += " | ";
                    }
                    sId += oFlattenedData[sKey] === null ? sap.secmon.ui.browse.Constants.C_VALUE.NULL : oFlattenedData[sKey];
                    aDims.push({
                        name : oKeyMap[sKey],
                        value : oFlattenedData[sKey],
                    });
                });
                that._data.push({
                    id : sId,
                    value : oFlattenedData[sVal],
                    raw : oFlattenedData[sVal],
                    dimensions : aDims
                });
            });
        }
    },

    onAfterRendering : function() {

        var that = this;

        // // Tooltip
        // this._d3Tooltip = d3.select("body").select("div.sapEtdDonutTooltip");
        // if (this._d3Tooltip.empty()) {
        // this._d3Tooltip = d3.select("body").append("div").attr("class",
        // "sapEtdDonutTooltip").style("opacity", 0);
        // }

        this._prepareData();

        var sIdDonut = "#" + this.getId();
        var sIdDonutContent = sIdDonut + "_Content";

        // Show text "No value" if no data is available
        var d3NoValue = d3.select(sIdDonut).selectAll("p").data(this._data.length > 0 ? [] : [ true ]);
        d3NoValue.enter().append("p");
        d3NoValue.text(oTextBundle.getText("BU_MSG_DonutNoData"));
        d3NoValue.exit().remove();

        // hide all div children
        d3.select(sIdDonut).selectAll("div").style("display", this._data.length > 0 ? null : "none");

        // Process normally
        this._svg = d3.select(sIdDonutContent + ".sapEtdDonut").select("svg");
        if (this._svg.empty()) {
            this._svg = d3.select(sIdDonutContent + ".sapEtdDonut").append("svg").attr("viewBox", "0 0 250 250").attr("preserveAspectRatio", "xMidYMid meet").classed("sapEtdDonutResponsive", true);
            this._svg.append("g").attr("class", "pie").attr("transform", "translate(" + this.getRadius() + "," + this.getRadius() + ")");
        }
        var donut = this._svg.select("g");

        // Draw the donut
        // create the instance & assign data and other properties
        this._donut.showLabel(true).showLegend(true).controlId(this.getId()).node({
            displayName : "Field"
        }).radius(this.getRadius()).innerRadius(this.getRadius() * 0.382)
        // assign the data
        /* .data(this._data) */
        .on("select", function(origin, bInverted, d, i) {
            var oDataSelected = $.extend(true, {}, d);
            oDataSelected.target = origin;
            if (!d3.event.ctrlKey) {
                // effective ways to clear an array
                // avoid using that._dataSelected = []
                // @see:
                // http://stackoverflow.com/questions/1232040/empty-an-array-in-javascript
                that._dataSelected.length = 0;
            }
            var C_MEASURE = "COUNT(*)[0]";
            // sort the data according to if
            // donut is inverted
            that._aFlattenedData.sort(function(a, b) {
                var ia = +a[C_MEASURE];
                var ib = +b[C_MEASURE];

                return (bInverted ? 1 : -1) * (ia > ib ? +1 : ia < ib ? -1 : 0);
            });

            // if multiple data has the same count
            var fnFindSelectedData = function(aData) {
                var iIndex = aData.findIndex(function(oItem){
                    var aValues = Object.values(oItem); 
                    var id = d.data.id === '__null__' ? null : d.data.id;
                    return aValues.indexOf(id) >= 0;
                });
                var C_MEASURE = "COUNT(*)[0]";
                var count = aData[iIndex][C_MEASURE];
                var oFoundItem;
                var k = iIndex;

                // search forwards and backwards
                [ +1, -1 ].some(function(idx) {
                    k += idx;
                    // check if k in the range
                    while (k >= 0 && k < aData.length && aData[k][C_MEASURE] === count) {
                        for ( var p in aData[k]) {
                            if (p.indexOf(C_MEASURE) < 0 && aData[k][p] === (d.data.id === "__null__" ? null : d.data.id)) {
                                // we found the entry
                                oFoundItem = aData[k];
                                return true;
                            }
                        }
                        k += idx;
                    }
                });

                return oFoundItem;
            };

            var oFound = fnFindSelectedData(that._aFlattenedData);
            if (!oFound) {
                throw "[Donut] Selected data cannot be found";
            }

            that._dataSelected.push(oFound);
            that._dataSelectHandler(new sap.ui.base.Event("idDonutDataSelect", that, {
                data : [ oDataSelected ]
            }));
        });

        // load and update
        donut.call(this._donut, this._data);

        $(window).resize(function() {
            var browserZoomLevel = Math.round(window.devicePixelRatio * 100);
            var sizeParam = 2 * browserZoomLevel;
                if(browserZoomLevel <= 100){
                    this._svg = d3.select(sIdDonutContent + ".sapEtdDonut").select("svg")
                        .attr("viewBox", "0 0 250 250").attr("preserveAspectRatio", "xMidYMid meet").classed("sapEtdDonutResponsive", true);
                } else {
                    this._svg = d3.select(sIdDonutContent + ".sapEtdDonut").select("svg")
                        .attr("viewBox", "0 0" + " " + sizeParam + " " + sizeParam).attr("preserveAspectRatio", "xMidYMid meet").classed("sapEtdDonutResponsive", true);
                }
            });
    }
});