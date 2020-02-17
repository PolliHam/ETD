/* globals d3, attackPath */
$.sap.declare("sap.secmon.ui.malimon.AttackPath");

$.sap.require("sap.secmon.ui.malimon.AttackPath-d3");

sap.ui.core.Control.extend("sap.secmon.ui.malimon.AttackPath", {

    metadata : {
        properties : {
            width : {
                type : "CSSSize",
                defaultValue : "100%"
            },
            height : {
                type : "CSSSize",
                defaultValue : "100%"
            },
            showUTC : {
                type : "boolean"
            },
            color : {
                type : "object"
            },
        },
        aggregations : {},

        events : {
            nodeRightClick : {},
            nodeLeftClick : {},
        },
    },

    _attackPath : undefined,
    _svg : undefined,
    _aaRelevantAttributes : undefined,
    _aaCustomNameById : undefined,

    init : function() {
        this._aaCustomNameById = {};
        this._aaRelevantAttributes = {};
        this._attackPath = attackPath();
    },

    renderer : function(oRm, oControl) {
        oRm.write("<div");
        oRm.writeControlData(oControl);
        oRm.addClass('sapEtdAttackPath');
        oRm.writeClasses();
        oRm.write(">");
        oRm.write("</div>");
    },

    _update : function(aData) {
        // Tooltip used for hovering over events and correlations
        var oTooltip = d3.select("body").select("div.sapEtdEntityGraphTooltip");
        if (oTooltip.empty()) {
            oTooltip = d3.select("body").append("div").attr("class", "sapEtdEntityGraphTooltip").style("opacity", 0);
        }

        // Sort data from oldest to youngest
        // everything is dependent on this sortation
        aData.sort(function(a, b) {
            return Date.parse(a.Timestamp) - Date.parse(b.Timestamp);
        });

        // Data attack path d3 needs
        var oPreparedData = {
            "nodes" : [],
            "connections" : [],
            "links" : []
        };

        // Excludes duplicates
        var aaNodesByEId = {};
        for (var i = 0; i < aData.length; i++) {
            var curEle = aData[i];

            // Data a Event-Node needs
            aaNodesByEId[curEle.Id] = {
                "id" : curEle.Id,
                // "timestamp" : new Date(curEle.Timestamp),
                "timestamp" : curEle.Timestamp,
                "pimaryConnection" : undefined,
                // if there is a custom name set for the element, it is to be used rather than the element name.
                "elementName" : this._aaCustomNameById[curEle.Id] ? this._aaCustomNameById[curEle.Id] : curEle.EventName,
                // Makes coordinates accesible for the links
                "x" : 0,
                "y" : 0
            };
        }

        for ( var nodeId in aaNodesByEId) {
            oPreparedData.nodes.push(aaNodesByEId[nodeId]);
        }

        // Draw Connections between Elements

        // Prepare Data for correlation search
        var aCorrData = [];
        for (var k = 0; k < aData.length; k++) {
            var oElem = aData[k];
            var oCorrDataObj = {};
            for ( var key in oElem) {
                if (oElem.hasOwnProperty(key) && this._aaRelevantAttributes.hasOwnProperty(key) && this._aaRelevantAttributes[key] === true) {
                    if (!oCorrDataObj.hasOwnProperty(oElem[key])) {
                        oCorrDataObj[oElem[key]] = [ key ];
                    } else {
                        oCorrDataObj[oElem[key]].push(key);
                    }
                }
            }
            aCorrData.push(oCorrDataObj);
        }

        var correlationCounter = 1;
        for (var l = 0; l < aCorrData.length; l++) {
            var firstElem = aCorrData[l];
            var bPrimary = true;

            // Every younger Element than the first
            for (var j = l + 1; j < aCorrData.length; j++) {
                var secondElem = aCorrData[j];

                var oConnection = {
                    "id" : aData[l].Id + aData[j].Id,
                    "connectsFrom" : aaNodesByEId[aData[l].Id],
                    "connectsTo" : aaNodesByEId[aData[j].Id],
                    "correlations" : []
                };
                // First found connection has to be to the next chronological element
                // so it is primary for our purpose

                for ( var value in firstElem) {
                    if (secondElem.hasOwnProperty(value)) {
                        var oCorrelation = {
                            "id" : "correlation" + correlationCounter++,
                            "fromPropertyName" : firstElem[value],
                            "toPropertyName" : secondElem[value],
                            "fromProperty" : this.fnToGoodName(firstElem[value], true),
                            "toProperty" : this.fnToGoodName(secondElem[value], true),
                            "value" : value,
                            // Makes coordinates accessible for the links
                            "x" : 0,
                            "y" : 0
                        };
                        oConnection.correlations.push(oCorrelation);
                    }
                }
                if (oConnection.correlations.length > 0) {
                    oConnection.primary = bPrimary;

                    if (bPrimary) {
                        // If the first connection is found, the following aren't primary
                        oConnection.connectsFrom.primaryConnection = oConnection;
                        bPrimary = false;
                    }
                    oPreparedData.connections.push(oConnection);
                }
            }
        }

        // fill links
        for (var m = 0; m < oPreparedData.connections.length; m++) {
            var aCorrelations = oPreparedData.connections[m].correlations;
            var connectsFrom = oPreparedData.connections[m].connectsFrom;
            var connectsTo = oPreparedData.connections[m].connectsTo;

            // For each found correlation, two lines are needed.
            for (var n = 0; n < aCorrelations.length; n++) {
                var oCor = aCorrelations[n];
                oPreparedData.links.push({
                    "id" : connectsFrom.Id + oCor.fromProperty + oCor.value + oCor.toProperty,
                    "node" : connectsFrom,
                    "correlation" : oCor
                });
                oPreparedData.links.push({
                    "id" : connectsFrom.Id + oCor.fromProperty + oCor.value + oCor.toProperty + oCor.id,
                    "node" : connectsTo,
                    "correlation" : oCor
                });

            }
        }

        var oParentDom = this.getDomRef().parentElement;
        var iHeight = oParentDom.clientHeight !== 0 ? oParentDom.clientHeight - 16 : 0;
        var iWidth = oParentDom.parentElement.clientWidth - iHeight + (iHeight/4);
        var oRoot;
        if (!this._svg) {
            this._svg =
                    d3.select(".sapEtdAttackPath").append("svg").attr("width", iWidth).attr("height", iHeight).attr("viewBox", "0 0 " + iWidth + " " + iHeight).attr("preserveAspectRatio",
                            "xMidYMid meet");
            oRoot = this._svg.append("g").attr("transform", "translate(0,0)");
        } else {
            oRoot = this._svg.select("g");
            this._svg.attr("viewBox", "0 0 " + iWidth + " " + iHeight).attr("width", iWidth).attr("height", iHeight).attr("preserveAspectRatio", "xMidYMid meet");
            d3.select(".sapEtdAttackPath").node().appendChild(this._svg.node());
        }

        this._attackPath.data(oPreparedData).height(iHeight).width(iWidth).tooltip(oTooltip).showUTC(this.getShowUTC());
        this._attackPath.onNodeLeftClick(jQuery.proxy(this.fireNodeLeftClick, this)).onNodeRightClick(jQuery.proxy(this.fireNodeRightClick, this));
        oRoot.call(this._attackPath);
        this.saveAttackPath(oPreparedData.connections);
    },

    onBeforeRendering : function() {
        // handle the data updating
        this.getModel().bindList("/data").attachChange(function() {
            this.onAfterRendering();
        }, this);
    },

    onAfterRendering : function() {
        this._svg = d3.select(".sapEtdAttackPath").select("svg");
        if (this._svg.empty()) {
            var oParentDom = this.getDomRef().parentElement;
            var iWidth = oParentDom.clientWidth;
            var iHeight = oParentDom.clientHeight !== 0 ? oParentDom.clientHeight - 16 : 0;
            this._svg =
                    d3.select(".sapEtdAttackPath").append("svg").attr("width", iWidth).attr("height", iHeight).attr("viewBox", "0 0 " + iWidth + " " + iHeight).attr("preserveAspectRatio",
                            "xMidYMid meet");
            this._svg.append("g").attr("transform", "translate(0,0)");
        }

        var aData = this.getModel().getProperty("/data");
        if (aData && aData.length) {
            this._update(aData);
        }

    },

    // Attributes that are true this._aaRelevantAttributes are used for drawing correlations
    setRelevantAttributes : function(attributes, bRelevant) {
        if (attributes && attributes.length) {
            for (var i = 0; i < attributes.length; i++) {
                this._aaRelevantAttributes[attributes[i]] = bRelevant;
            }
        }

        var aData = this.getModel().getProperty("/data");
        if (aData && aData.length) {
            this._update(aData);
        }
    },

    setCustomNameForID : function(Id, CustomName) {
        this._aaCustomNameById[Id] = CustomName;

        var aData = this.getModel().getProperty("/data");
        if (aData && aData.length) {
            this._update(aData);
        }
    },

    fnToGoodName : function(sName, bShort) {
        var oFieldNamesData = sap.ui.getCore().getModel("FieldNamesModel").getData();
        var sContext = "Log";
        // in case the sName is not found => echo
        var result = sName;
        if (bShort) {
            if (sName === sap.secmon.ui.malimon.Constants.C_TYPE.EVENT && oFieldNamesData[sContext].EventCode){ 
                result = oFieldNamesData[sContext].EventCode.displayName; 
            }
            if (oFieldNamesData[sContext] && oFieldNamesData[sContext][sName] && oFieldNamesData[sContext][sName].displayName) {
                result = oFieldNamesData[sContext][sName].displayName;
            }
        } else {
            if (oFieldNamesData[sContext] && oFieldNamesData[sContext][sName] && oFieldNamesData[sContext][sName].description) {
                result = oFieldNamesData[sContext][sName].description;
            }
        }
        return result;
    },

    findCorrelatedAttributes : function(aCorrelations){
        var that = this;
        var aFrom = [];
        var aTo = [];
        var oPreparedAttributes = {from : [], to : []};
        aCorrelations.forEach(function(oAttrName){
            var aFromProrpertyNameAttr = oAttrName.fromPropertyName.map(function(sProp){
                return {
                    attrName : sProp,
                    attrValue : oAttrName.value,
                    attrDisplayName : that.fnToGoodName(sProp, true)
                };
            });
            var aToProrpertyNameAttr = oAttrName.toPropertyName.map(function(sProp){
                return {
                    attrName : sProp,
                    attrValue : oAttrName.value,
                    attrDisplayName : that.fnToGoodName(sProp, true)
                };
            });
            aFrom.push(aFromProrpertyNameAttr);
            aTo.push(aToProrpertyNameAttr);
        });
        oPreparedAttributes.from = Array.prototype.concat.apply([], aFrom);
        oPreparedAttributes.to = Array.prototype.concat.apply([], aTo);
        return oPreparedAttributes;
    },

    saveAttackPath: function(aData) {
        var that = this;
        var oModel = this.getModel("AttackPathStepModel");
        var aPreparedData = [];
        aData.forEach(function(oItem, index){
            var oCorrelatedAttributes = that.findCorrelatedAttributes(oItem.correlations);

            var oObjFrom = {
                stepNumber : index,
                idEvent : oItem.connectsFrom.id,
                eventName : oItem.connectsFrom.elementName,
                timestampEvent: oItem.connectsFrom.timestamp,
                correlatedAttributes : oCorrelatedAttributes.from
            };

            var oObjTo = {
                stepNumber : index,
                idEvent : oItem.connectsTo.id,
                eventName : oItem.connectsTo.elementName,
                timestampEvent: oItem.connectsTo.timestamp,
                correlatedAttributes : oCorrelatedAttributes.to
            };

            aPreparedData.push(oObjFrom, oObjTo);    
        }.bind(this));

        oModel.setProperty("/steps", aPreparedData);
    }
});