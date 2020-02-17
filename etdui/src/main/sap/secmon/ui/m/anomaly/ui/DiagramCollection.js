/* globals d3 */
$.sap.declare("sap.secmon.ui.m.anomaly.ui.DiagramCollection");
$.sap.require("sap.secmon.ui.m.anomaly.ui.Sunburst-d3");
$.sap.require("sap.ui.base.Event");
jQuery.sap.require("sap.secmon.ui.m.anomaly.ui.Constants");

/**
 * Data structure: d = {Features:[],Entity:{entity:{},scores:[] } }
 * 
 */

sap.ui.core.Control.extend("sap.secmon.ui.m.anomaly.ui.DiagramCollection", {

    metadata : {
        properties : {
            height : {
                type : "sap.ui.core.CSSSize",
                defaultValue : "1000px"
            },
            width : {
                type : "sap.ui.core.CSSSize",
                defaultValue : "500px"
            },
            data : {
                type : "any",
            },
            level : {
                type : "int",
                defaultValue : 10
            },
            factor : {
                type : "float",
                defaultValue : 1.0
            }
        },

        aggregations : {
            _viewSelection : {
                type : "sap.ui.layout.form.SimpleForm",
                multiple : false,
                visibility : "hidden"
            }
        },

        events : {
            select : {
                selectedData : "any"
            },
            selectFeature : {
                featureName : "string"
            },
            callCBFn : {
                entity : "any"
            },
            showContextMenue : {
                entity : "any",
                features: "any"
            },
            showContextMenueDetails : {
                entity : "any"
            },
        }
    },
    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.DiagramCollection
     */
    _svg : undefined,
    _diagram : undefined,
    _area : undefined,
    _anchor : {
      X: 0,
      Y: 0
    },
    _patternMetadata : [],
    _data : undefined,
    _sId : undefined,
    _isPointOutlier : undefined,
    _sunburst : undefined,
    _oViewSelection: undefined,
    _sSelectedView : undefined,
    _margin : {
        top : 50,
        right : 50,
        bottom : 50,
        left : 50
    },
    _w : undefined,
    _h : undefined,
    _that : this,
    
    _fn : function(selectedEntity, _that) {
        _that.fireCallCBFn({
            entity : selectedEntity
        });
    },
    
    _fnShowContextMenueDetails : function(selectedEntity, _that) {
        _that.fireShowContextMenueDetails({
            entity : selectedEntity
        });
    },
    _colorOutlier : '#e31c1c',
    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.DiagramCollection
     */

    
    init : function() {
        this._sId = "#" + this.getId();
        var _that = this;
        this._oViewSelection = new sap.ui.layout.form.SimpleForm({  
            editable : true,
            width : "360px",
            layout : sap.ui.layout.form.SimpleFormLayout.GridLayout,
            content : [ 
                new sap.m.Label({ 
                    text: "{i18n>BU_FLOD_TXT_Diagram}"
                }), 
                new sap.ui.layout.HorizontalLayout({
                    content:[
                        new sap.m.ComboBox({
                            change : [ 
                                function(oEvent) {
                                    _that._sSelectedView = oEvent.oSource.getSelectedKey();
                                    _that.update(); 
                                }, this 
                            ] 
                        }),
                        new sap.m.Button({
                            icon : "sap-icon://sys-help-2",
                            type : 'Transparent',
                            tooltip : "{i18n>OpenHelp_TTP}",
                            press : [ 
                                function(oEvent) {
                                    if(oEvent.getSource().getParent().getContent()[0].getSelectedKey() === 'DIVERSITY') {
                                        window.open("/sap/secmon/help/50755d4ee87e4ce4b949910d9b0262db.html"); 
                                    } else {
                                        window.open("/sap/secmon/help/4dbd10721aec432786264f57b96745d3.html"); 
                                    }
                                }, this 
                            ] 
                        })       
                    ]
                })
            ]
        }).addStyleClass("sapEtdADPadding");
                   
        this.setAggregation("_viewSelection", this._oViewSelection);
    },
    
    getText : function(sTextKey) {
        var parameters = Array.prototype.slice.call(arguments, 0), model = this.getModel("i18n").getResourceBundle();
        return model.getText.apply(model, parameters);
    },

    /**
     * show tooltip
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.DiagramCollection
     */
    _showTooltip : function(oData) {
        // position the tooltip in the proper place of mouse click
        var d3Tooltip = d3.select("body").select("div.sapEtdADTooltip");
        d3Tooltip.style("opacity", 1);
        var sEntityName = "";

        for (var j = 1; j < oData.entity.length; j++) {
            if (sEntityName) {
                sEntityName = sEntityName + "/" + oData.entity[j];
            } else {
                sEntityName = oData.entity[j];
            }
            
        }
        
        var sHtml = "<table><tr><td class='left-column'>" + "<b>" + sEntityName + "</b>" + "</td><td>" + "</td></tr>";
        var aFeatures = this.getData().features, sEntityId = oData.entity[0];
        for (var i = 0; i < aFeatures.length; i++) {
            if(sEntityId === "StandardDeviation"){
                sHtml += "<tr><td class='left-column'>" + aFeatures[i].name + ":</td><td>" + "0 - " + (oData.scores[i] * 100).toFixed(0) + "</td></tr>";
            } else{
            sHtml += "<tr><td class='left-column'>" + aFeatures[i].name + ":</td><td>" + (oData.scores[i] * 100).toFixed(0) + "</td></tr>";
            }
        }
        sHtml += "</table>";

        d3Tooltip.html(sHtml).style("left", function(d) {
            // x coordinate
            var divWidth = d3.select(this).property("offsetWidth");
            return d3.event.pageX - 0.5 * divWidth + "px";
        }).style("top", function(d) {
            // y coordinate
            var divHeight = d3.select(this).property("offsetHeight");
            return (d3.event.layerY < divHeight ? d3.event.pageY + 0.5 * divHeight : d3.event.pageY - 1.5 * divHeight) + "px";
        });
    },

    /**
     * hide tooltip
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.DiagramCollection
     */
    _hideTooltip : function() {
        var d3Tooltip = d3.select("body").select("div.sapEtdADTooltip");
        d3Tooltip.html("");
        d3Tooltip.style("opacity", 0).style("left", "0px").style("top", "0px");
    },

    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.DiagramCollection
     */
    hightlightSelectedEntity : function(oEntity) {
        var entityId;
        if (oEntity) {
            entityId = oEntity[0];
        }
        switch (this._sSelectedView) {
        case "SPIDER":
            this._svg.selectAll("polygon").transition(200).style("fill-opacity", 0).style("stroke-width", "1px");
            this._svg.selectAll("polygon.radar-chart-StandardDeviation").transition(200).style("fill-opacity", 0.5).style("stroke-width", "0.5px");
            this._svg.selectAll("polygon[id='" + entityId + "']").transition(200).style("fill-opacity", 0.8).style("stroke-width", "3px");
            break;
        case "DIVERSITY":
            this._svg.selectAll("circle").transition(200).style('fill', function(d) {
                if(d.entity.isOutlier === false){
                    return "steelblue";
                }else{
                    return '#e31c1c';
                }
            }).style("stroke-width", "0.2px").attr("r", 5.5);
            this._svg.selectAll("circle[id='" + entityId + "']").transition(200).style('fill', "#73AD21").style("stroke-width", "0.5px").attr("r", 11);
            break;
        case "1DIMENSION":
            this._svg.selectAll("rect").transition(200).style('fill', function(d) {
                if(d.isOutlier === false){
                    return "steelblue";
                }else{
                    return '#e31c1c';
                }
            });
            this._svg.selectAll("rect[id='" + entityId + "']").transition(200).style("fill", '#73AD21');
            break; 
        case "2DIMENSIONS":
            this._svg.selectAll("circle").transition(200).style('fill', function(d) {
                if(d.isOutlier === false){
                    return "steelblue";
                }else{
                    return '#e31c1c';
                }
            }).attr("r", 6.5);
            this._svg.selectAll("circle[id='" + entityId + "']").transition(200).style('fill', "#73AD21").attr("r", 11);
            break;    
        }
    },
    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.DiagramCollection
     */
    renderer : function(oRm, oControl) {
        oRm.write("<div");
        oRm.writeControlData(oControl);
        oRm.addClass('sapEtdSpiderNet');
        oRm.writeClasses();
        oRm.write(">");
        oRm.renderControl(oControl._oViewSelection);
        oRm.write("</div>");
    },
    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.DiagramCollection
     */
    onBeforeRendering : function() {
    },

    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.DiagramCollection
     */
    onAfterRendering : function() {
        this._data = this.getData();
        if (!this._data) {
            return;
        }
        // points can be empty, but axis can be build up already
        if ($.isEmptyObject(this._data.features)) {
            return;
        }

        if (!this._data.points) {
            return;
        }
        
        // 
        this._w = parseInt(this.getWidth()) - this._margin.left - this._margin.right;
        this._h = parseInt(this.getHeight()) - this._margin.top - this._margin.bottom;
        // Tooltip
        var d3Tooltip = d3.select("body").select("div.sapEtdADTooltip");
        if (d3Tooltip.empty()) {
            d3Tooltip = d3.select("body").append("div").attr("class", "sapEtdADTooltip").style("opacity", 0);
        }
        // available view depend on dimensions length
        this._setViewSelection(this._data.features.length);
        this.update();
    },
    /**
     * used for switching view: 1DIMENSION, 2DIMENSION, or NDIMENION = SPIDER or CLUSTER
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.DiagramCollection
     */
    _setViewSelection : function( iDimension){
        var oComboBox = this._oViewSelection.getContent()[1].getContent()[0];
        oComboBox.removeAllItems();
        switch (iDimension) {
        case 1:
            this._sSelectedView = "1DIMENSION";
            oComboBox.addItem(new sap.ui.core.ListItem({
            text : "{i18n>BU_FLOD_LBL_ScoreO}",
            key : this._sSelectedView
            }));
            oComboBox.setSelectedKey(this._sSelectedView);
            break;
        case 2:
            this._sSelectedView = "2DIMENSIONS";
            oComboBox.addItem(new sap.ui.core.ListItem({
            text : "{i18n>BU_FLOD_LBL_ScoreO}",
            key : this._sSelectedView
            }));
            oComboBox.setSelectedKey(this._sSelectedView);
            break;
        default:
            if(!(this._sSelectedView === "SPIDER" || this._sSelectedView === "DIVERSITY")){
                this._sSelectedView = "SPIDER";
            }
            oComboBox.addItem(new sap.ui.core.ListItem({
                text : "{i18n>BU_FLOD_LBL_ScoreO}",
                key :  "SPIDER"
                }));
            oComboBox.addItem(new sap.ui.core.ListItem({
                text : "{i18n>BU_FLOD_LBL_ScoreD}",
                key : "DIVERSITY"
                }));
            oComboBox.setSelectedKey(this._sSelectedView);
        }
    },
    
   
    update : function() {
        this._cleanUp();
        switch (this._sSelectedView) {
        case '1DIMENSION':
            this._buildOneDimensionView();
            break;
        case '2DIMENSIONS':
            this._buildTwoDimensionView();
            break;
        case 'SPIDER':
            this._buildSpiderDiagram();
            break;
        case 'DIVERSITY':
            this._buildClusterView();
            break;    
        }
    },
    /**
     * used for hiding sunburst
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.DiagramCollection
     */
    hideDetails : function() {
        this._diagram.style("opacity", 1.0);
        this._area.transition().duration(600).ease('ease').attr("transform", "translate("+ this._anchor.X +"," + this._anchor.Y +")scale(1)");
        this._sunburst.hideDetails();
    },

    /**
     * show details
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.DiagramCollection
     */
    showDetails : function(selectedEntity, entityDetails) {
        this._area.transition().duration(600).ease('ease').attr("transform", "translate("+ this._anchor.X +"," + this._anchor.Y +")scale(1)");
        if(entityDetails.sunburst.children.length === 0){
            var sEntityName;
            for(var i = 1; i<selectedEntity.entity.length; i++){
               if(sEntityName){
                   sEntityName = sEntityName + ' | ' + selectedEntity.entity[i]; 
               } else{
                   sEntityName = selectedEntity.entity[i]; 
               }
            }
            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, this.getText("BU_FLOD_MSG_NODET", sEntityName));
            this._diagram.style("opacity", 1.0);
            this._area.transition().duration(600).ease('ease').attr("transform", "translate("+ this._anchor.X +"," + this._anchor.Y +")scale(1)");
              
        }else{
            if(this._sSelectedView === 'SPIDER'){
                this._sunburst(selectedEntity, entityDetails, parseInt(this.getWidth()), parseInt(this.getHeight()), this._svg, true);  
            }else{
            this._sunburst(selectedEntity, entityDetails, parseInt(this.getWidth()), parseInt(this.getHeight()), this._svg);
            }
        }
    },
    /**
     * building spider diagram
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.DiagramCollection
     */
    _buildSpiderDiagram : function() {
        var _that = this;
        
        // data
        var aAxes = this._data.features, area;
        var d = this._data.points;
        
        // initial values
        var maxValue = 1, j;
        var total = aAxes.length;
        var series = 0;
        var allAxis = (aAxes.map(function(i, j) {
            return i.name;
        }));
        
        // sizes
        if (aAxes.length > 3 ) { 
            this.setFactor(0.95); 
        } else { 
            this.setFactor(1.1);
         }
        
        var factor = this.getFactor();
        var factorLegend = factor;
        var radius = factor * Math.min((this._w / 2), this._h / 2);
        var outerRadius = this.getFactor() * radius;
        var radians = 2 * Math.PI; // full circle
        var iXCenter = (parseInt(this.getWidth()) - outerRadius * 2) / 2;
        var iYCenter = aAxes.length > 3 ? ((parseInt(this.getHeight()) - outerRadius * 2) / 2) : ((parseInt(this.getHeight())/2) - outerRadius) + this._margin.top;
        var iLegendWidth = 190;
        // functions
        var zoomed = function() {
            area.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        };
        var zoom = d3.behavior.zoom().scaleExtent([ 1, 10 ]).on("zoom", zoomed);
        
        // SVG
        this._svg = d3.select(this._sId + ".sapEtdSpiderNet").select("svg");
        if (this._svg.empty()) {
            this._svg = d3.select(this._sId + ".sapEtdSpiderNet").append("svg").attr("viewBox", "0 0 " + parseInt(this.getWidth()) + " " + 
                    parseInt(this.getHeight())).attr("preserveAspectRatio", "xMidYMid meet").classed("sapEtdSpiderNetResponsive", false).call(zoom);
        }
        // spider
        area = this._svg.append("g").attr("transform", "translate(" + iXCenter + "," + iYCenter + ")");
        this._area = area;
        this._anchor.X = iXCenter;
        this._anchor.Y = iYCenter;
        var diagram = area.append("g").attr("transform", "translate(" + 0 + "," + 0 + ")");
        this._diagram = diagram;
        var levelFactor;
        
        // Circular segments
        for (j = 0; j < this.getLevel(); j++) {
            levelFactor = this.getFactor() * radius * ((j + 1) / this.getLevel());
            diagram.selectAll(".sapEtdSpiderNetLevel").data(allAxis).enter().append("svg:line").attr("x1", function(d, i) {
                return levelFactor * (1 - factor * Math.sin(i * radians / total));
            }).attr("y1", function(d, i) {
                return levelFactor * (1 - factor * Math.cos(i * radians / total));
            }).attr("x2", function(d, i) {
                return levelFactor * (1 - factor * Math.sin((i + 1) * radians / total));
            }).attr("y2", function(d, i) {
                return levelFactor * (1 - factor * Math.cos((i + 1) * radians / total));
            }).attr("class", "line").style("stroke", "grey").style("stroke-opacity", "0.75").style("stroke-width", "0.3px").attr("transform",
                    "translate(" + (outerRadius - levelFactor) + ", " + (outerRadius - levelFactor) + ")");
        }

        // Text indicating at what % each level is
        for (j = 0; j < this.getLevel(); j++) {
            levelFactor = this.getFactor() * radius * ((j + 1) / this.getLevel());
            diagram.selectAll(".sapEtdSpiderNetLevel").data([ 1 ]).enter().append("svg:text").attr("x", function(d) {
                return levelFactor * (1 - factor * Math.sin(0));
            }).attr("y", function(d) {
                return levelFactor * (1 - factor * Math.cos(0));
            }).attr("class", "legend").style("font-size", "12px").attr("transform",
                    "translate(" + (outerRadius - levelFactor) + ", " + (outerRadius - levelFactor) + ")").attr("fill", "#737373").text(function(d) {
                var tickValue;
                tickValue = (j + 1) / _that.getLevel();
                if ((tickValue * 10) % 2 === 0) {
                    return tickValue * 100;
                }
            });
        }
        // Axes
        var axis = diagram.selectAll(".axis").data(allAxis).enter().append("g").attr("class", "axis");
        var axisFactor = factor * 1;
        axis.append("line").attr("x1", outerRadius).attr("y1", outerRadius).attr("x2", function(d, i) {
            return outerRadius * (1 - axisFactor * Math.sin(i * radians / total));
        }).attr("y2", function(d, i) {
            return outerRadius * (1 - axisFactor * Math.cos(i * radians / total));
        }).attr("class", "line").style("stroke", "grey").style("stroke-width", "0.3px");

        axis.append("text").attr("class", "legend").text(function(d) {
            return _that.getText("Evaluation_TXT") + ": " + d;
        }).style("font-size", "12px").attr("text-anchor", "middle").attr("dy", "1.5em").attr("transform", function(d, i) {
            return "translate(0, 0)";
        }).attr("x", function(d, i) {
            return outerRadius * (1 - factorLegend * Math.sin(i * radians / total)) - (iLegendWidth / 2) * Math.sin(i * radians / total);
        }).attr("y", function(d, i) {
            return outerRadius * (1 - Math.cos(i * radians / total)) - 45 * Math.cos(i * radians / total);
        }).on('click', function(ld, i) {
            // fire the selection event with selected data
// _that.fireSelectFeature({
// featureName : ld
// });
        });// .call(wrapText, iLegendWidth);

        // Polygon for normalized acceptance area
        var aaAcceptance = [];
        var entity = [];
        entity.push("StandardDeviation");
        entity.push(this.getText("BU_FLOD_TXT_NCR"));
        aaAcceptance.push({
            entity : entity,
            scores : this.getData().normalSphere.distances.radius
        });
        // polygon for SD
        aaAcceptance.forEach(function(y, x) {
            var dataValues = [];
            diagram.selectAll(".nodes").data(
                    y.scores,
                    function(j, i) {
                        dataValues.push([ outerRadius * (1 - (parseFloat(Math.max(j, 0)) / maxValue) * factor * Math.sin(i * radians / total)),
                                outerRadius * (1 - (parseFloat(Math.max(j, 0)) / maxValue) * factor * Math.cos(i * radians / total)), ]);
                    });
            dataValues.push(dataValues[0]);
            diagram.selectAll(".diagram").data([ dataValues ]).enter().append("polygon").attr("id", "StandardDeviation").attr("class", "radar-chart-StandardDeviation").style("stroke-width", "1px")
                    .style("stroke", "#666666").style("stroke-dasharray", "3, 3").attr("points", function(d) {
                        var str = "";
                        for (var pti = 0; pti < d.length; pti++) {
                            str = str + d[pti][0] + "," + d[pti][1] + " ";
                        }
                        return str;
                    }).style("fill", function(j, i) {
                        return "#666666";
                    }).style("fill-opacity", 0.5).on('mouseover', function(d) {
                        var z = "polygon." + d3.select(this).attr("class");
                        diagram.selectAll("polygon").transition(200).style("fill-opacity", 0.1);
                        diagram.selectAll(z).transition(200).style("fill-opacity", 0.7).style("stroke-width", "1.5px");
                        _that._showTooltip(y);
                    }).on('mouseout', function() {
                        var z = "polygon." + d3.select(this).attr("class");
                        diagram.selectAll("polygon").transition(200).style("fill-opacity", 0).style("stroke-width", "1.5px");
                        diagram.selectAll(z).transition(200).style("fill-opacity", 0.5).style("stroke-width", "1px");
                        _that._hideTooltip();
                    });

        });
        
        // Polygon for points
        d.forEach(function(y, x) {
            if (y.isSelected) {
                _that._isPointOutlier = y.isOutlier;
                var dataValues = [];
                diagram.selectAll(".nodes").data(
                        y.scores,
                        function( j, i) {
                            dataValues.push([ outerRadius * (1 - (parseFloat(Math.max(j, 0)) / maxValue) * factor * Math.sin(i * radians / total)),
                                    outerRadius * (1 - (parseFloat(Math.max(j, 0)) / maxValue) * factor * Math.cos(i * radians / total)), ]);
                        });
                dataValues.push(dataValues[0]);
                diagram.selectAll(".diagram").data([ dataValues ]).enter().append("polygon").attr("id", y.entity[0]).attr("class", "radar chart serie" + series).style("stroke-width", "1px").style(
                        "stroke", function(d){
                            if(_that._isPointOutlier){
                                return _that._colorOutlier;
                            } else {
                                return "steelblue";// color(series)
                            }
                        }).attr("points", function(d) {
                    var str = "";
                    for (var pti = 0; pti < d.length; pti++) {
                        str = str + d[pti][0] + "," + d[pti][1] + " ";
                    }
                    return str;

                }).style("fill", function(d){
                    if(_that._isPointOutlier){
                        return _that._colorOutlier;
                    } else {
                        return "steelblue";// color(series)
                    }
                }).style("fill-opacity", 0).on('mouseover', function(d) {
                    var z = "polygon." + d3.select(this).attr("class");
                    diagram.selectAll("polygon").transition(200).style("fill-opacity", 0.1);
                    diagram.selectAll(z).transition(200).style("fill-opacity", 0.7).style("stroke-width", "2px");
                    // revert for node standard deviation
                    diagram.selectAll("polygon.radar-chart-StandardDeviation").transition(200).style("fill-opacity", 0.5).style("stroke-width", "0.5px");
                    _that._showTooltip(y);
                }).on('mouseout', function() {
                    diagram.selectAll("polygon").transition(200).style("fill-opacity", 0).style("stroke-width", "1px");
                    diagram.selectAll("polygon.radar-chart-StandardDeviation").transition(200).style("fill-opacity", 0.5).style("stroke-width", "0.5px");
                    _that._hideTooltip();
                }).on('click', function(d){
                    var oDataSelected = $.extend(false, {}, y);
                    oDataSelected.target = this;
                    _that._click(oDataSelected, _that, diagram);
                });
                series++;
            }
        });
        this._sunburst = sap.secmon.ui.m.anomaly.ui["Sunburst-d3"].sunburst(this._fnShowContextMenueDetails, this, area);
    },
    /**
     * building clustering view
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.DiagramCollection
     */
    _buildClusterView : function() {
        var _that = this;
        // data
        var d = this._data.points, area;
        // sizes
        var radius = this.getFactor() * Math.min((this._w / 2), this._h / 2);
        var total = this._data.features.length;
        var radians = 2 * Math.PI; // full circle
        var factor = this.getFactor();
        var outerRadius = this.getFactor() * radius;
        
        // functions
        var zoomed = function () {
            area.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        };
        var zoom = d3.behavior.zoom().scaleExtent([ 1, 10 ]).on("zoom", zoomed);
        
        // Predare data: polygon for points, which is derived from polygons area
        // and centroid
        var oAxesDomain = {};
        // this._patternMetadata = [];
        var aPatternMetadata = [];
        d.forEach(function(y, x) {
            if (y.isSelected) {
                var polygonPionts4Calc = [];
                var polygonPiontsAreaMax = [];
                var polygonPiontsAreaMin = [];
                y.scores.forEach(function(score, idx) {
                    // for CENTROID and AREA calculation
                    // get max/min area
                    if (aPatternMetadata.length === 0) {
                        polygonPiontsAreaMax.push([ outerRadius * (1 - (parseFloat(Math.max((1 + 0.0001), 0)) / (1 + 0.0001)) * factor * Math.sin(idx * radians / (total))),
                                outerRadius * (1 - (parseFloat(Math.max((1 + 0.0001), 0)) / (1 + 0.0001)) * factor * Math.cos(idx * radians / (total))), ]);
                        if (idx % 2 === 1) {
                            polygonPiontsAreaMin.push([ outerRadius * (1 - (parseFloat(1.0001) / (1 + 0.0001)) * factor * Math.sin(idx * radians / (total))),
                                    outerRadius * (1 - (parseFloat(1.0001) / (1 + 0.0001)) * factor * Math.cos(idx * radians / (total))), ]);

                        } else {
                            polygonPiontsAreaMin.push([ outerRadius * (1 - (parseFloat(Math.max(0.0001, 0)) / (1 + 0.0001)) * factor * Math.sin(idx * radians / (total))),
                                    outerRadius * (1 - (parseFloat(Math.max(0.0001, 0)) / (1 + 0.0001)) * factor * Math.cos(idx * radians / (total))), ]);
                        }
                    }
                    polygonPionts4Calc.push([ outerRadius * (1 - (parseFloat(Math.max((score + 0.0001), 0)) / (1 + 0.0001)) * factor * Math.sin(idx * radians / (total))),
                            outerRadius * (1 - (parseFloat(Math.max((score + 0.0001), 0)) / (1 + 0.0001)) * factor * Math.cos(idx * radians / (total))), ]);
                });
                polygonPionts4Calc.push(polygonPionts4Calc[0]);
                var oGeomPolygon;
                var aCentroid;
                var aArea;

                if (aPatternMetadata.length === 0) {
                    polygonPiontsAreaMax.push(polygonPiontsAreaMax[0]);
                    polygonPiontsAreaMin.push(polygonPiontsAreaMin[0]);

                    oAxesDomain.areaMax = d3.geom.polygon(polygonPiontsAreaMax).area();
                    oAxesDomain.areaMin = d3.geom.polygon(polygonPiontsAreaMin).area();
                    oAxesDomain.centroidXMin = 0;
                    oAxesDomain.centroidXMax = radius * 2;
                    oAxesDomain.centroidYMin = 0;
                    oAxesDomain.centroidYMax = radius * 2;
                }
                oGeomPolygon = d3.geom.polygon(polygonPionts4Calc);
                aCentroid = oGeomPolygon.centroid();
                aArea = oGeomPolygon.area();
                aPatternMetadata.push({
                    entity : y,
                    centroid : aCentroid,
                    area : aArea
                });
            }
        });

        // SVG
        this._svg = d3.select(this._sId + ".sapEtdSpiderNet").select("svg");
        if (this._svg.empty()) {
            this._svg = d3.select(this._sId + ".sapEtdSpiderNet").append("svg").attr("viewBox", "0 0 " + parseInt(this.getWidth()) + " " + 
                    parseInt(this.getHeight())).attr("preserveAspectRatio", "xMidYMid meet").classed("sapEtdSpiderNetResponsive", false).call(zoom);
        }
        area = this._svg.append("g").attr("transform", "translate(" + this._margin.left + "," + this._margin.top/2 + ")");
        this._anchor.X = this._margin.left;
        this._anchor.Y = this._margin.top/2;
        this._area = area;
        var diagram = area.append("g").attr("transform", "translate(" + 0 + "," + 0 + ")");
        this._diagram = diagram;
        var w = this._w , h = this._h;
        var corner = {
            X1 : w * 0.2,
            Y1 : 0,
            X2 : w * 0.8,
            Y2 : 0,
            X3 : w * 0.8,
            Y3 : h * 1.0,
            X4 : w * 0.2,
            Y4 : h * 1.0
        };
        var root = {
            X : w * 0.5,
            Y : h * 0.8
        };
        var coord = {
            XArea : root.X,
            YArea : 0,
            XCentroidY : w * 0.8,
            YCentroidY : h * 1.0,
            XCentroidX : w * 0.2,
            YCentroidX : h * 1.0
        };

        // f(x) = m * x + c
        var m = (corner.Y4 - root.Y) / (root.X - corner.X4);
        var aAxis = [ "AXIS_LBL_AREA", "AXIS_LBL_CENTROIDX", "AXIS_LBL_CENTROIDY" ];
        // Arrow
        diagram.append("svg:marker").attr("id", "arrow-head").attr("viewBox", "0 -5 10 10").attr("refX", 0).attr("refY", 0).attr("markerWidth", 10).attr("markerHeight", 10).attr("orient", "auto")
                .append("svg:path").attr("d", "M0,-5L10,0L0,5").attr("class", "arrow");
        
        
        // Axis
        var axis = diagram.selectAll(".axisOutlierPattern").data(aAxis).enter().append("g").attr("class", "axisOutlierPattern");
        axis.append("svg:line").attr("id", function(d, i) {
            return "axis" + aAxis[i];
        }).attr("x1", root.X).attr("y1", root.Y).attr("x2", function(d, i) {
            var xEnd;
            switch (d) {
            case "AXIS_LBL_AREA":
                xEnd = coord.XArea;
                break;
            case "AXIS_LBL_CENTROIDX":
                xEnd = coord.XCentroidX;
                break;
            case "AXIS_LBL_CENTROIDY":
                xEnd = coord.XCentroidY;
                break;
            }
            return xEnd;
        }).attr("y2", function(d, i) {
            var yEnd;
            switch (d) {
            case "AXIS_LBL_AREA":
                yEnd = coord.YArea + 20;
                break;
            case "AXIS_LBL_CENTROIDX":
                yEnd = coord.YCentroidX;
                break;
            case "AXIS_LBL_CENTROIDY":
                yEnd = coord.YCentroidY;
                break;
            }
            return yEnd;
        }).style("stroke", "grey").style("stroke-width", "0.7px").style("marker-end", "url(#arrow-head)");
        // Add label to each axis
        axis.append("text").attr("class", "legend").text(function(d) {
            return _that.getText(d);
        }).style("font-size", "14px").attr("text-anchor", "middle").attr("dy", "1.5em").attr("transform", function(d, i) {
            var labelEndPos = 0;
            if (d === "AXIS_LBL_AREA") {
                labelEndPos = -25;
            }
            return "translate(0, " + labelEndPos + ")";
        }).attr("x", function(d, i) {
            var labelPosX = d3.select(this.parentNode).select("line").attr("x2");
            return labelPosX;
        }).attr("y", function(d, i) {
            var labelPosY = d3.select(this.parentNode).select("line").attr("y2");
            return labelPosY;
        });
        // Ground
        var ground = diagram.selectAll(".groundOutlierPattern").data([ 1 ]).enter().append("g").attr("class", "groundOutlierPattern");
        for (var i = 0; i < 5; i++) {
            var iPartition = (i + 1) / 5;
            ground.append("line").attr("x1", root.X + (corner.X2 - root.X) * iPartition).attr("y1", root.Y + (coord.YCentroidX - root.Y) * iPartition).attr("x2",
                    coord.XCentroidX + (root.X - coord.XCentroidX) * iPartition).attr("y2", coord.YCentroidX + (coord.YCentroidX - root.Y) * iPartition).attr("class", "line").style("stroke", "grey")
                    .style("stroke-width", "0.3px");
            ground.append("line").attr("x1", root.X - (root.X - corner.X4) * iPartition).attr("y1", root.Y + (coord.YCentroidX - root.Y) * iPartition).attr("x2",
                    coord.XCentroidY - (root.X - corner.X4) * iPartition).attr("y2", coord.YCentroidY + (coord.YCentroidX - root.Y) * iPartition).attr("class", "line").style("stroke", "grey").style(
                    "stroke-width", "0.3px");
        }
        // some calculations and function
        var Area = d3.scale.linear().domain([ oAxesDomain.areaMin, oAxesDomain.areaMax ]).range([ coord.YArea, root.Y ]);
        // calculate max centroid via Satz des Pythagoras
        var CentroidMax = Math.sqrt(Math.pow(h - root.Y, 2) + Math.pow((root.X - corner.X4), 2));
        var CentroidX = d3.scale.linear().domain([ oAxesDomain.centroidXMin, oAxesDomain.centroidXMax ]).range([ 0, CentroidMax ]);
        var CentroidY = d3.scale.linear().domain([ oAxesDomain.centroidYMin, oAxesDomain.centroidYMax ]).range([ 0, CentroidMax ]);
        
        // plot aPatternMetadata
        // set initial position to root
        var circles = diagram.append("g").selectAll("circle").data(aPatternMetadata).enter().append("circle").attr("id", function(d, i) {
            return d.entity.entity[0];
        }).attr("r", 5.5).style('fill', function(d) {
            if (d.entity.isOutlier) {
                return '#e31c1c';
            } else {
                return "steelblue";
            }
        }).style("stroke", "black").style("stroke-width", "0.2px").attr("cx", function(d, i) {
            return root.X;
        }).attr("cy", function(d, i) {
            return root.Y;
        });

        // move position to endposition
        circles.transition().duration(600).ease('ease').attr("transform", function(d) {
            var deltaX = CentroidX(d.centroid[0]) * (-1);
            var deltaY = (m * deltaX) * (-1);
            return "translate(" + deltaX + "," + deltaY + ")";
        }).transition().duration(600).ease('ease').attr("transform", function(d) {
            var deltaX1 = (CentroidY(d.centroid[1]) === parseFloat(0)) ? root.X : CentroidY(d.centroid[1]);
            deltaX1 = (deltaX1 === parseFloat(0)) ? root.X : deltaX1;
            deltaX1 = deltaX1 + CentroidX(d.centroid[0]) * (-1);
            var deltaY1 = m * CentroidY(d.centroid[1]) + m * CentroidX(d.centroid[0]);
            return "translate(" + deltaX1 + "," + deltaY1 + ")";
        }).transition().duration(600).ease('ease').attr(
                "transform",
                function(d) {
                    var deltaAreaX = (CentroidY(d.centroid[1]) === parseFloat(0)) ? root.X : CentroidY(d.centroid[1]);
                    deltaAreaX = (deltaAreaX === parseFloat(0)) ? root.X : deltaAreaX;
                    deltaAreaX = deltaAreaX + CentroidX(d.centroid[0]) * (-1);
                    var deltaAreaY = (Area(d.area) <= Area(oAxesDomain.areaMin)) ? m * (CentroidY(d.centroid[1]) + CentroidX(d.centroid[0])) : m * (CentroidY(d.centroid[1]) + 
                            CentroidX(d.centroid[0])) - Area(d.area);

                    return "translate(" + deltaAreaX + "," + deltaAreaY + ")";
                });
        circles.on('mouseover', function(d) {
            _that._showTooltip(d.entity);
        }).on('mouseout', function(d) {
            _that._hideTooltip(d.entity);
        }).on('click', function(d){
            var oDataSelected = $.extend(false, {}, d.entity);
            oDataSelected.target = this;
            _that._click(oDataSelected, _that, diagram);
        });
        
        this._sunburst = sap.secmon.ui.m.anomaly.ui["Sunburst-d3"].sunburst(this._fnShowContextMenueDetails, this, area);
    },
   
    /**
     * building one dimension view
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.DiagramCollection
     */
    _buildOneDimensionView : function() {
        var _that = this;
        // sizes
        var margin = {
                left: 50,
                right: 50,
                top: 0,
                bottom: 0
        };
        var width = this._w - margin.left - margin.right;
        var height = this._h - margin.top - margin.bottom;
        var area;
        // functions
        var x = d3.scale.linear().domain([ 0, 1 ]).range([ 0, width ]);
        var y = d3.scale.ordinal().rangeRoundBands([0, height], 0.05);
        var aPoints = this._data.points.filter(function(d) { 
            return d.isSelected;
            });
        var aFeatures = this._data.features;
        y.domain(aPoints.map(function(d, i) { 
                if(d.entity && d.entity.length !== 0){
                    return d.entity[0]; 
                }
            }));
        var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(function(d) {
            if ((d * 10) % 2 === 0) {
                return d * 100;
            }
        });
        var yAxis = d3.svg.axis().scale(y).orient("left").tickSize(0).tickPadding(0).tickFormat(function(d){
              return "";
           });
        var zoomed = function () {
            area.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        };
        var zoom = d3.behavior.zoom().scaleExtent([ 1, 10 ]).on("zoom", zoomed);
        
        // SVG
        this._svg = d3.select(this._sId + ".sapEtdSpiderNet").select("svg");
        if (this._svg.empty()) {
            this._svg = d3.select(this._sId + ".sapEtdSpiderNet").append("svg").attr("viewBox", "0 0 " + parseInt(this.getWidth()) + " " + 
                    parseInt(this.getHeight())).attr("preserveAspectRatio", "xMidYMid meet").classed("sapEtdSpiderNetResponsive", false).call(zoom);
        }
        area = this._svg.append("g").attr("transform", "translate(" + this._margin.left + "," + this._margin.top + ")");
        this._anchor.X = this._margin.left;
        this._anchor.Y = this._margin.top;
        this._area = area;
        var diagram = area.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        this._diagram = diagram;
        // draw Axes
        diagram.append("g")
        .attr("class", "x sapETDFeatureAxis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

        diagram.append("g")
        .attr("class", "y sapETDFeatureAxis")
        .call(yAxis);
        
        // add a small label for the feature name
        diagram.append("text").attr("x", 0 ).attr("y", -20 ).style("text-anchor", "start").style("font-size", "14px").text(function(d) {
            return _that.getText("Evaluation_TXT") + ": " + aFeatures[0].name;
        });
        // draw bar
        diagram.selectAll(".bar").data(aPoints).enter().append("rect").attr("id", function(d){
            return d.entity[0];
        }).attr("fill", function(d) { 
            if(d.isOutlier === false){
                return "steelblue";
            }else{
                return _that._colorOutlier;
            }})
        .on('mouseover', function(d) {
            _that._showTooltip(d);
        }).on('mouseout', function() {
            _that._hideTooltip();
        })
        .on('click', function(d){
            var oDataSelected = $.extend(false, {}, d);
            oDataSelected.target = this;
            _that._click(oDataSelected, _that, diagram);
        })
        .attr("x", function(d) { return x(0); })
        .attr("y", function(d, i) { 
            if(d.entity && d.entity.length !== 0){
                return y(d.entity[0]); 
            }else{
                return i;
            }})
        .attr("height", y.rangeBand())
        .attr("width", function(d) { return Math.abs(x(0)); })
        .transition()
        .duration(200)
        .delay(function (d, i) {
                return i * 100;
            })
        .attr("width", function (d, i) {
           return  Math.abs(x(d.distances.avg));
        });
        
        var yTextPadding = 15;
        diagram.selectAll(".bartext")
        .data(aPoints)
        .enter()
        .append("text")
        .filter(function(d) { 
            return d.isSelected;
        })
        .attr("class", "bartext")
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("x", function(d,i) {
            return Math.abs(x(d.distances.avg)) - yTextPadding;
        })
        .attr("y", function(d,i) {
            if(d.entity && d.entity.length !== 0){
                return y(d.entity[0]) + yTextPadding; 
            }})
        .text(function(d){
             return (d.distances.avg * 100).toFixed(0);
        })
        .attr("fill", "white");
        this._sunburst = sap.secmon.ui.m.anomaly.ui["Sunburst-d3"].sunburst(this._fnShowContextMenueDetails, this, area);
    },
    /**
     * building one dimension view
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.DiagramCollection
     */
    _buildTwoDimensionView : function() {
        var _that = this;
        // sizes
        var margin = {
                left: 50,
                right: 50,
                top: 0,
                bottom: 0
        };
        var width = this._w - margin.left - margin.right;
        var height = this._h - margin.top - margin.bottom;
        var area;
        // functions
        var x = d3.scale.linear().domain([ 0, 1 ]).range([ 0, width ]);
        var y = d3.scale.linear().domain([ 0, 1 ]).range([ height, 0  ]);
        var aPoints = this._data.points.filter(function(d) { 
            return d.isSelected;
            });
        var aFeatures = this._data.features;
        var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(function(d) {
            if ((d * 10) % 2 === 0) {
                return d * 100;
            }
        });
        var yAxis = d3.svg.axis().scale(y).orient("left").tickFormat(function(d) {
            if ((d * 10) % 2 === 0) {
                return d * 100;
            }
        });
        var zoomed = function () {
            area.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        };
        var zoom = d3.behavior.zoom().scaleExtent([ 1, 10 ]).on("zoom", zoomed);
        
        // SVG
        this._svg = d3.select(this._sId + ".sapEtdSpiderNet").select("svg");
        if (this._svg.empty()) {
            this._svg = d3.select(this._sId + ".sapEtdSpiderNet").append("svg").attr("viewBox", "0 0 " + parseInt(this.getWidth()) + " " + 
                    parseInt(this.getHeight())).attr("preserveAspectRatio", "xMidYMid meet").classed("sapEtdSpiderNetResponsive", false).call(zoom);
        }
        area = this._svg.append("g").attr("transform", "translate(" + this._margin.left + "," + this._margin.top + ")");
        this._anchor.X = this._margin.left;
        this._anchor.Y = this._margin.top;
        this._area = area;
        var diagram = area.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        this._diagram = diagram;
        // draw Axes
        diagram.append("g")
        .attr("class", "x sapETDFeatureAxis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
        diagram.append("g")
        .attr("class", "y sapETDFeatureAxis")
        .call(yAxis);
        
        // Axes labels
     // add a small label for the feature name.
        diagram.append("text").attr("x", width).attr("y", height + 40 ).style("text-anchor", "end").style("font-size", "14px").text(function(d) {
            return _that.getText("Evaluation_TXT") + ": " + aFeatures[0].name;
        });
        diagram.append("text").attr("x", 0 ).attr("y", -20 ).style("text-anchor", "start").style("font-size", "14px").text(function(d) {
            return _that.getText("Evaluation_TXT") + ": " + aFeatures[1].name;
        });
        
        // plot circles
        diagram.append("g").selectAll("circle").data(aPoints).enter().append("circle").attr("id", function(d, i) {
            return d.entity[0];
        })
        .style('fill', function(d) {
            if(d.isOutlier === false){
                return "steelblue";
            }else{
                return _that._colorOutlier;
            }
        }).style("stroke", "black").style("stroke-width", "0.2px").attr("cx", function(d, i) {
            return x(d.scores[0]);
        })
        .attr("cy", function(d, i) {
            return y(d.scores[1]);
        })
        .on('mouseover', function(d) {
            _that._showTooltip(d);
        }).on('mouseout', function() {
            _that._hideTooltip();
        })
        .on('click', function(d){
            var oDataSelected = $.extend(false, {}, d);
            oDataSelected.target = this;
            _that._click(oDataSelected, _that, diagram);
        })
        .attr("r", 0)
        .transition()
        .duration(200)
        .delay(function (d, i) {
                return i * 100;
            })
        .attr("r", 6.5);
        
        this._sunburst = sap.secmon.ui.m.anomaly.ui["Sunburst-d3"].sunburst(this._fnShowContextMenueDetails, this, area);
    },
    /**
     * opens sunburst for displaying details of selected entity
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.DiagramCollection
     */
    _click : function (d, control, diagram) {
        // avoid backend call in case there are no details available
        var bNoValues = true;
        var i;
         var aFeatures = [];
         for (i = 0; i < this._data.features.length; i++) {
           if(this._data.features[i].aggregationMethod === sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_METHOD.SND){
               if (d.rawQuery[i] !== 0) {
                   bNoValues = false; 
                   aFeatures.push({
                       aggregationMethod: this._data.features[i].aggregationMethod,
                       id: this._data.features[i].id,
                       name: this._data.features[i].name,
                       nameSpace: this._data.features[i].nameSpace,
                       hasValues: true 
                   });
                }  
           }else if(this._data.features[i].aggregationMethod === sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_METHOD.RVM){
               // no hint if this kind of evaluation has values, therefore add
                // as backend needs to handle this
                   bNoValues = false; 
                   aFeatures.push({
                       aggregationMethod: this._data.features[i].aggregationMethod,
                       id: this._data.features[i].id,
                       name: this._data.features[i].name,
                       nameSpace: this._data.features[i].nameSpace,
                       hasValues: true 
                   });
              
           }            
         }
         
         if (bNoValues) {
         var sEntityName;
         for (i = 1; i < d.entity.length; i++) {
             if (sEntityName) {
                 sEntityName = sEntityName + " | " + d.entity[i];
             } else {
                 sEntityName = d.entity[i];
             }
         }
         new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, this.getText("BU_FLOD_MSG_NODET", sEntityName));
         } else {
          diagram.style("opacity", 0.3);
          control.fireShowContextMenue({
              entity : d,
              features: aFeatures
          });
        // _area.transition().duration(600).ease('ease').attr("transform",
        // "translate(50,25)scale(1)");
         }
    },
    /**
     * remove svg if existing => required for reqbuilding view
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.DiagramCollection
     */
    _cleanUp : function() {
        var svg = d3.select(this._sId + ".sapEtdSpiderNet").select("svg");
        if (!svg.empty()) {
            svg.remove();
        }
    }
});
