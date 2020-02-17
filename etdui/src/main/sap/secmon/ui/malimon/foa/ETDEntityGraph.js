/* globals d3, oTextBundle, entitygraph */
jQuery.sap.require("sap.ui.model.odata.CountMode");
$.sap.declare("sap.secmon.ui.malimon.foa.ETDEntityGraph");

/**
 * SAPUI5 wrapper of d3 implementation of EntityGraph
 * 
 * @see: ETDEntityGraph-d3.js
 */
$.sap.require("sap.secmon.ui.browse.Constants");
$.sap.require("sap.secmon.ui.malimon.foa.ETDEntityGraph-d3");
$.sap.require("sap.secmon.ui.m.commons.InvestigationCreator");
$.sap.require("sap.secmon.ui.m.commons.InvestigationAddendum");

sap.ui.core.Control.extend("sap.secmon.ui.malimon.foa.ETDEntityGraph",
        {

            metadata : {
                properties : {
                    lastSelectedNode : {
                        type : "object"
                    },
                },

                aggregations : {
                    data : {
                        type : "sap.ui.base.ManagedObject"
                    },
                    _menu : {
                        type : "sap.ui.unified.Menu",
                        multiple : false,
                        visibility : "hidden"
                    }
                },

                events : {
                    nodePress : {},
                    select : {},
                }
            },

            // d3 instance
            _ETDEntityGraph : undefined,
            _oLastSelectedNodeGraph : undefined,

            setLastSelectedNode : function(oValue) {
                this.setProperty("lastSelectedNode", oValue, true);
            },

            init : function() {
                // default model for this control
                this.setModel(new sap.ui.model.json.JSONModel());

                // create the d3 instance and assign the display settings
                var oConfigModel = sap.ui.getCore().getModel("ConfigModel");
                var aaDisplaySettings = oConfigModel.getProperty("/config/displaySettings");

                this._ETDEntityGraph = entitygraph().settings(aaDisplaySettings);

                // menu for operation upon selection
                var oInvestigationCreatorController = sap.ui.controller("sap.secmon.ui.m.commons.InvestigationCreatorDialog");
                var oInvestigationAddendumController = sap.ui.controller("sap.secmon.ui.m.commons.InvestigationAddendumDialog");

                var oAlertODataModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/ui/m/alerts/AlertDetailsWithCounts.xsodata", {
                    json : true,
                    defaultCountMode : sap.ui.model.odata.CountMode.Inline
                });

                // helper function
                var getDistinctAlerts = function(aAlert) {
                    var aDistinctAlert = [];
                    var aTempAlert = [];
                    aAlert.forEach(function(oAlert) {
                        aTempAlert[oAlert.AlertId] = oAlert;
                    });
                    for ( var id in aTempAlert) {
                        aDistinctAlert.push(aTempAlert[id]);
                    }

                    return aDistinctAlert;
                };

                var getSelectedAlerts =
                        function(aNodes) {
                            var aAlerts = [];
                            aNodes.forEach(function(oAlert, i) {
                                oAlertODataModel.read("/Alerts", {
                                    async : false,
                                    filters : [ new sap.ui.model.Filter({
                                        path : "Number",
                                        operator : sap.ui.model.FilterOperator.EQ,
                                        value1 : oAlert.name
                                    }) ],
                                    success : function(data) {
                                        if (data.results.length) {
                                            var oAlert = data.results[0];
                                            // oAlert.AlertId = data.results[0].Id;
                                            oAlert.AlertId = sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(data.results[0].AlertId);
                                            oAlert.AlertHashCode = sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(data.results[0].AlertHashCode);
                                            aAlerts.push(oAlert);
                                        }
                                    },
                                    error : function() {
                                        sap.ui.commons.MessageBox.show(oTextBundle.getText("MM_MSG_EntityNotFound", oAlert.name), sap.ui.commons.MessageBox.Icon.ERROR, "Malimon",
                                                sap.ui.commons.MessageBox.Action.OK);
                                    }
                                });
                            });

                            return getDistinctAlerts(aAlerts);
                        };

                // context menu to assign alerts to investigation
                var that = this;
                this.setAggregation("_menu", new sap.ui.unified.Menu({
                    items : [
                            new sap.ui.unified.MenuItem({
                                // startsSection : true,
                                text : "{i18n>MM_TIT_StartInv}",
                                tooltip : "{i18n>MM_TOL_StartInv}",
                                icon : sap.ui.core.IconPool.getIconURI("create"),
                                select : [
                                        function(oEvent) {
                                            var aAlerts = getSelectedAlerts(oEvent.getSource().getParent().data("selected"));
                                            oInvestigationCreatorController.openDialog(aAlerts, that.getParent().getParent().getParent(), function() {
                                                // remove the selection
                                                that._ETDEntityGraph.removeSelection();
                                                // refetch the alert investigation table
                                                var oInvestigationODataModel = sap.ui.getCore().getModel("InvestigationODataModel");
                                                oInvestigationODataModel.read("/Investigations", {
                                                    success : function(data) {
                                                        if (data.results.length) {
                                                            that.getModel().setProperty("/investigations", data.results);
                                                            // that.getModel().refresh(true);
                                                            that._update(null);
                                                        }
                                                    },
                                                    error : function() {
                                                        // TODO: Meaningful error message
                                                        sap.ui.commons.MessageBox.show(oTextBundle.getText("MM_MSG_EntityNotFound", sId), sap.ui.commons.MessageBox.Icon.ERROR, "Malimon",
                                                                sap.ui.commons.MessageBox.Action.OK);
                                                        // TODO: Generic Malimon Functionality ???
                                                    }
                                                });
                                            }, function() {
                                                return sap.secmon.ui.browse.utils.XCSRFToken ? sap.secmon.ui.browse.utils.XCSRFToken :
                                                // try to get this token again
                                                sap.secmon.ui.browse.utils.getXCSRFToken().getResponseHeader('X-CSRF-Token');
                                            });
                                        }, this ]
                            }),

                            new sap.ui.unified.MenuItem({
                                startsSection : false,
                                text : "{i18n>MM_TIT_Add2Inv}",
                                tooltip : "{i18n>MM_TOL_Add2Inv}",
                                icon : sap.ui.core.IconPool.getIconURI("add-product"),
                                enabled : {
                                    path : "",
                                    formatter : function(dummy) {

                                    }
                                },
                                select : [
                                        function(oEvent) {
                                            var aAlerts = getSelectedAlerts(oEvent.getSource().getParent().data("selected"));
                                            oInvestigationAddendumController.openDialog(aAlerts, that.getParent().getParent().getParent(), function() {
                                                // remove the selection
                                                that._ETDEntityGraph.removeSelection();
                                                // refetch the alert investigation table
                                                // TODO:make sure only the shown alerts are
                                                // included!
                                                var oInvestigationODataModel = sap.ui.getCore().getModel("InvestigationODataModel");
                                                oInvestigationODataModel.read("/Investigations", {
                                                    success : function(data) {
                                                        if (data.results.length) {
                                                            that.getModel().setProperty("/investigations", data.results);
                                                            // that.getModel().refresh(true);
                                                            that._update(null);
                                                        }
                                                    },
                                                    error : function() {
                                                        // TODO: Meaningful error message
                                                        sap.ui.commons.MessageBox.show(oTextBundle.getText("MM_MSG_EntityNotFound", sId), sap.ui.commons.MessageBox.Icon.ERROR, "Malimon",
                                                                sap.ui.commons.MessageBox.Action.OK);
                                                        // TODO: Generic Malimon Functionality
                                                    }
                                                });
                                            }, function() {
                                                return sap.secmon.ui.browse.utils.XCSRFToken ? sap.secmon.ui.browse.utils.XCSRFToken :
                                                // try to get this token
                                                // again
                                                sap.secmon.ui.browse.utils.getXCSRFToken().getResponseHeader('X-CSRF-Token');
                                            });
                                        }, this ]
                            }),
                    // new sap.ui.unified.MenuItem({
                    // startsSection : true,
                    // text : "Remove from Investigation",
                    // tooltip : "Remove the selected alerts from its investigation",
                    // icon : sap.ui.core.IconPool.getIconURI("delete"),
                    // select : [
                    // function(oEvent) {
                    // var aAlerts =
                    // getSelectedAlerts(oEvent.getSource().getParent().data("selected"));
                    // var oQuery = [];
                    // var aFilters = [];
                    // aAlerts.forEach(function(oAlert) {
                    // aFilters.push(new sap.ui.model.Filter({
                    // path : "AlertNumber",
                    // operator : sap.ui.model.FilterOperator.EQ,
                    // value1 : oAlert.Number
                    // }));
                    //
                    // // create a query to delete the selected
                    // // alerts from
                    // // investigation
                    // var oInvestigationODataModel =
                    // sap.ui.getCore().getModel("InvestigationODataModel");
                    // oInvestigationODataModel.read("/Investigations", {
                    // async : false,
                    // filters : [ new sap.ui.model.Filter({
                    // filters : aFilters,
                    // and : false
                    // }) ],
                    // success : function(data) {
                    // data.results.forEach(function(oInvest) {
                    // oQuery.push({
                    // "Id" :
                    // sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(oInvest.Id),
                    // "Alerts" : [ {
                    // "AlertId" : oAlert.AlertId
                    // } ]
                    //
                    // });
                    //
                    // var sQuery = JSON.stringify(oQuery);
                    // sap.secmon.ui.browse.utils.postJSon("/sap/secmon/services/ui/m/invest/Investigation.xsjs/Alerts",
                    // sQuery).done(
                    // function(response, textStatus, XMLHttpRequest) {
                    // var oInvestigationODataModel =
                    // sap.ui.getCore().getModel("InvestigationODataModel");
                    // oInvestigationODataModel.read("/Investigations", {
                    // success : function(data) {
                    // if (data.results.length) {
                    // that.getModel().setProperty("/investigations", data.results);
                    // that.getModel().refresh(true);
                    // }
                    // },
                    // error : function() {
                    // sap.ui.commons.MessageBox.show("Entity with Id " + sId + " not
                    // found",
                    // sap.ui.commons.MessageBox.Icon.ERROR, "Malimon",
                    // sap.ui.commons.MessageBox.Action.OK);
                    // }
                    // });
                    // }).fail(function(jqXHR, textStatus, errorThrown) {
                    // });
                    //
                    // });
                    // },
                    // error : function() {
                    // sap.ui.commons.MessageBox.show("Entity with Id " + sId + " not
                    // found",
                    // sap.ui.commons.MessageBox.Icon.ERROR, "Malimon",
                    // sap.ui.commons.MessageBox.Action.OK);
                    // }
                    // });
                    //
                    // });
                    //
                    // }, this ]
                    // }),
                    ]
                }));
            },

            exit : function() {
                delete this._ETDEntityGraph;
            },

            renderer : function(oRm, oControl) {
                oRm.write("<div");
                oRm.writeControlData(oControl);
                oRm.addClass('sapEtdEntityGraph');
                oRm.writeClasses();
                oRm.write(">");
                oRm.write("</div>");
            },

            _update : function(oEvent) {
                var oJQContainer = $("[id$=etdEntityGraphContainer]");
                var iContainerHeight = oJQContainer.parent().height();
                var iEntityGraphHeaderHeight = $(oJQContainer.parent().parent().children()[0]).height();

                // setup the correct ratio of SVG
                var iWidth = oJQContainer.width();
                var iHeight = iContainerHeight - iEntityGraphHeaderHeight - 18; // minus oNoData.height

                // handle no data
                var aData = this.getModel().getProperty("/data");

                var oNoData = d3.select(".sapEtdEntityGraph").selectAll('div.status').data($.isEmptyObject(aData) ? [ "No data" ] : []);
                oNoData.enter().append("div").classed("status", true).style("text-align", "center").html(function(d) {
                    return d;
                });
                oNoData.exit().remove();                

                var oRoot, oSvg;// = d3.select(".sapEtdEntityGraph").select("svg");

                $(".sapEtdEntityGraph svg").remove();

                // if (oSvg.empty()) {
                oSvg =
                        d3.select(".sapEtdEntityGraph").append("svg").attr("viewBox", "0 0 " + iWidth + " " + iHeight).attr("preserveAspectRatio", "xMidYMid meet").classed(
                                "sapEtdEntityGraphResponsive", true);
                oRoot = oSvg.append("g").attr("transform", "translate(0,0)");
                // } else {
                // oRoot = oSvg.select("g");
                // }

                // Tooltip
                var oTooltip = d3.select("body").select("div.sapEtdEntityGraphTooltip");
                if (oTooltip.empty()) {
                    oTooltip = d3.select("body").append("div").attr("class", "sapEtdEntityGraphTooltip").style("opacity", 0);
                }

                // prepare the data
                var aDimensions = this.getModel().getProperty("/dimensions");
                var sRepresentation = this.getModel().getProperty("/representation");

                var that = this;
                var enableRemove = function(d) {
                    // get all the links
                    return true;
                };

                // create the instance & assign data and other
                // properties
                this._ETDEntityGraph.width(iWidth).height(iHeight).tooltip(oTooltip).focus(sRepresentation)
                // assign the data
                .data(this.createGraphData(aData, {
                    dimensions : aDimensions,
                    focus : sRepresentation,
                    investigations : this.getModel().getProperty("/investigations")
                }, oEvent))
                // catching the events coming from d3
                .on('select', function(oTrigger, d) {
                    if (that.getModel("applicationContext").getProperty("/userPrivileges/investigationWrite")) {
                        var domSel = oTrigger;
                        var oMenu = that.getAggregation("_menu");
                        // attach the selected data to the custom data of menu
                        oMenu.data("selected", d);
                        if (!enableRemove(d)) {
                            oMenu.getItems()[2].setEnabled(false);
                        }
                        oMenu.open(false, domSel, sap.ui.core.Popup.Dock.RightBottom, sap.ui.core.Popup.Dock.RightBottom, domSel, "200 20");
                        that.fireSelect();
                    }
                }).on('nodePress', function(d) {
                    // hide the tooltip
                    var oTooltip = d3.select("body").select("div.sapEtdEntityGraphTooltip");
                    if (oTooltip) {
                        oTooltip.style("opacity", 0);
                    }
                    var aAlertNumbers = [];
                    // find alerts in max 2 levels deep
                    that._ETDEntityGraph.findNeighbors(d).forEach(function(oNode) {
                        if (oNode.type !== "Alert") {
                            that._ETDEntityGraph.findNeighbors(oNode).forEach(function(oNode2) {
                                if (oNode2.type === "Alert") {
                                    aAlertNumbers.push(oNode2.name);
                                }
                            });
                        } else {
                            aAlertNumbers.push(oNode.name);
                        }
                    });
                    that.fireNodePress({
                        node : d,
                        alerts : aAlertNumbers
                    });
                });

                // load and update
                oRoot.call(this._ETDEntityGraph);
            },

            onAfterRendering : function() {
                // var aData = this.getBinding("data").getContexts().map(function(oContext) {
                // return oContext.getObject();
                // });
                // // update the graphic
                // this._update(aData);
                // if (this._oLastSelectedNodeGraph) {
                // this.triggerNodePress(this._oLastSelectedNodeGraph.id, false);
                // }
                // this.setBusy(false);
            },

            /*
             * Prepare data for the graph
             * 
             * Entries are flattened data coming from backend. They are converted to graph data, which contains nodes and links
             */
            createGraphData : function(aEntries, oParams, oEvent) {

                if (!oParams.dimensions || !oParams.dimensions.length) {
                    return;
                }

                var that = this;

                // nodes
                var aNodes = [];
                var obj, aaNodes = {};

                var oConfigModel = sap.ui.getCore().getModel("ConfigModel");

                var aaEntities = oConfigModel.getProperty("/config/entities");

                var aGraphFocus = oConfigModel.getProperty("/config/focus");
                var aaGraphFocus = {};
                aGraphFocus.forEach(function(oGraphFocus) {
                    aaGraphFocus[oGraphFocus.name] = oGraphFocus;
                });

                var aaConfigLinks = aaGraphFocus[oParams.focus].links;
                var aLinks = [];
                var aDimensions = oParams.dimensions;

                // TODO: move to config.json later
                var aaRoleMap = {
                    "User" : {
                        "5418799227B72F66E10000000A4CF109" : "Acting",
                        "55EEEDD796440756E2E225E98E57FE30" : "Targeted"
                    },
                    "System" : {
                        "53EE56541AA9066CE10000000A4CF109" : "Actor",
                        "55EEEDD896440756E2E225E98E57FE30" : "Target"
                    },
                    "Hostname" : {
                        "53EE56551AA9066CE10000000A4CF109" : "Hostname"
                    },
                    "Pattern" : {
                        "53EE564E1AA9066CE10000000A4CF109" : "Pattern"
                    }
                };

                var aCenter = aaGraphFocus[oParams.focus].center;

                /*
                 * Entity focused representation:
                 * 
                 * 1. Find all the focused entities (acting or targeted) and add to our node list. 1) Put focused entities in the aFocusedEntities. 2) aFocusedEntities must be appended to the global
                 * aNodes later.
                 * 
                 * 2. Loop thru all the focused entities, for each of them find the corresponding entry in the entries and 1) Add entities (excluding focused entity) into node list aNodes directly. 2)
                 * establish the links
                 * 
                 */

                // create a indexed Array for investigations
                var aaAlertInvestigations = {};
                (oParams.investigations || []).forEach(function(oInvestigation) {
                    if (aaAlertInvestigations.hasOwnProperty(oInvestigation.AlertNumber)) {
                        aaAlertInvestigations[oInvestigation.AlertNumber].Investigations.push({
                            Id : sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(oInvestigation.Id),
                            Description : oInvestigation.Description,
                            Processor : oInvestigation.Processor
                        });
                    } else {
                        aaAlertInvestigations[oInvestigation.AlertNumber] = {
                            AlertNumber : oInvestigation.AlertNumber,
                            Investigations : [ {
                                Id : sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(oInvestigation.Id),
                                Description : oInvestigation.Description,
                                Processor : oInvestigation.Processor
                            } ]
                        };
                    }
                });

                var aaFocusedRoleMap = aaRoleMap[oParams.focus];

                var aFocusedRoles = [];
                for ( var prop in aaFocusedRoleMap) {
                    aFocusedRoles.push(prop);
                }

                // overwrite the displaySettings
                oConfigModel.loadData("/sap/secmon/ui/malimon/config.json", null, false);

                var aaSettings = oConfigModel.getProperty("/config/displaySettings");
                this._ETDEntityGraph.settings(aaSettings);

                // reset settings
                // TODO: focusedEitity.size = 40 in config.json
                aCenter.forEach(function(sEntity) {
                    aaSettings[sEntity].size = 40;
                });

                this._ETDEntityGraph.settings(aaSettings);

                // build a table for focused entities
                var aFocusedEntities = [];
                var aaFocusedEntities = {};
                var sEntryName = "";
                aEntries.forEach(function(oEntry) {
                    aFocusedRoles.forEach(function(sDim) {
                        sEntryName = "";
                        if (oEntry[sDim] === null) {
                            sEntryName = sap.secmon.ui.browse.Constants.C_VALUE.NULL;
                        } else if (oEntry[sDim]) {
                            sEntryName = oEntry[sDim];
                        }

                        if (sEntryName.length) {
                            if (!aaFocusedEntities[sEntryName]) {
                                obj = {
                                    id : sEntryName,
                                    name : sEntryName,
                                    techKey : sDim,
                                    value : +oEntry["COUNT(*)[0]"],
                                    type : aaEntities[sDim] ? aaEntities[sDim].type : "Generic",
                                    fieldName : aaEntities[sDim] ? aaEntities[sDim].fieldName : "",
                                };
                                aFocusedEntities.push(obj);
                                aaFocusedEntities[obj.id] = obj;

                            } else if (aaEntities[sDim].type !== aaFocusedEntities[sEntryName].type) {
                                aaFocusedEntities[sEntryName].type = oParams.focus;
                            }
                        }
                    });

                });

                // dimension without focused entities
                var aDimenesionRequired = aDimensions.filter(function(oDim) {
                    var bNotUserDimension = true;
                    aFocusedRoles.some(function(sUserRole) {
                        if (oDim.key === sUserRole) {
                            bNotUserDimension = false;
                            return true; // break this loop
                        }
                    });
                    return bNotUserDimension;
                });

                // append investigation
                aDimenesionRequired.push({
                    "key" : "0001",
                    "displayName" : "Investigation"
                });

                var aaInvestigationNodes = {};

                // loop thru the focused entities
                aFocusedEntities.forEach(function(oFocusedEntity) {
                    aaNodes = {};
                    aaNodes[oFocusedEntity.type + ":" + oFocusedEntity.id] = oFocusedEntity;
                    aEntries.filter(function(oEntry) {
                        // filters only the entries with this entity
                        var bFound = false;
                        aFocusedRoles.some(function(sUserRole) {
                            sEntryName = "";
                            if (oEntry[sUserRole] === null) {
                                sEntryName = sap.secmon.ui.browse.Constants.C_VALUE.NULL;
                            } else if (oEntry[sUserRole]) {
                                sEntryName = oEntry[sUserRole];
                            }
                            if (sEntryName === oFocusedEntity.id) {
                                bFound = true;
                                return true; // break this loop
                            }
                        });
                        return bFound;
                    }).forEach(function(oEntry) {
                        aDimenesionRequired.forEach(function(oDim) {
                            sEntryName = "";
                            if (oEntry[oDim.key] === null) {
                                sEntryName = sap.secmon.ui.browse.Constants.C_VALUE.NULL;
                            } else if (oEntry[oDim.key]) {
                                sEntryName = oEntry[oDim.key];
                            }
                            var sKey = oFocusedEntity.id + ":" + sEntryName;
                            if (sEntryName.length && !aaNodes[sKey]) {
                                obj = {
                                    id : sKey,
                                    name : sEntryName,
                                    techKey : oDim.key,
                                    value : +oEntry["COUNT(*)[0]"],
                                    type : aaEntities[oDim.key] ? aaEntities[oDim.key].type : "Generic",
                                    fieldName : aaEntities[oDim.key] ? aaEntities[oDim.key].fieldName : "",
                                };
                                aNodes.push(obj);
                                aaNodes[sKey] = obj;
                            }
                        });
                        // FocusedEntity -> Pattern
                        var aAllowedLinks = aaConfigLinks[oParams.focus];
                        // find the roles of the FocusedEntities
                        var bRole = 0;
                        // aFocusedRoles.forEach(function(sRole) {
                        // if (oEntry[sRole]) {
                        // bRole |= aaFocusedRoleMap[sRole].indexOf("Act") >= 0 ? 1 : 2;
                        // }
                        // });
                        aAllowedLinks.forEach(function(oAllowedLink) {
                            aLinks.push({
                                source : oFocusedEntity,
                                target : aaNodes[(oFocusedEntity.id + ":" + oEntry[oAllowedLink.key])],
                                role : bRole
                            /* ignnore the roles */
                            });
                        });

                        // other links
                        aDimenesionRequired.forEach(function(oSrcDim) {
                            var aAllowedLinks = aaConfigLinks[oSrcDim.key];
                            aDimenesionRequired.forEach(function(oTgtDim) {
                                if (oSrcDim !== oTgtDim) {
                                    (aAllowedLinks || []).forEach(function(oAllowedLink) {
                                        if (oTgtDim.key === oAllowedLink.key && oEntry[oSrcDim.key] && oEntry[oTgtDim.key]) {
                                            aLinks.push({
                                                source : aaNodes[oFocusedEntity.id + ":" + oEntry[oSrcDim.key]],
                                                target : aaNodes[oFocusedEntity.id + ":" + oEntry[oTgtDim.key]]
                                            });
                                        }
                                        // special handling for investigation
                                        if (oSrcDim.key === "53EE564D1AA9066CE10000000A4CF109"/* Alert */&& oTgtDim.displayName === "Investigation" &&
                                        //
                                        oEntry[oSrcDim.key] && aaAlertInvestigations[oEntry[oSrcDim.key]]) {
                                            aaAlertInvestigations[oEntry[oSrcDim.key]].Investigations.forEach(function(oInvestigation) {
                                                if (!aaInvestigationNodes[oInvestigation.Id]) {
                                                    var sKey = "Investigation:" + oInvestigation.Id;
                                                    obj = {
                                                        id : sKey,
                                                        name : oInvestigation.Description,
                                                        techKey : oTgtDim.key,
                                                        type : "Investigation",
                                                        fieldName : "Investigation",
                                                    };
                                                    aNodes.push(obj);
                                                    aaInvestigationNodes[oInvestigation.Id] = obj;
                                                }
                                                aLinks.push({
                                                    source : aaNodes[oFocusedEntity.id + ":" + oEntry[oSrcDim.key]],
                                                    target : aaInvestigationNodes[oInvestigation.Id]
                                                });
                                            });
                                        }
                                    });
                                }
                            });
                        });

                    });
                });

                // add focused entities to the nodes
                aNodes = aNodes.concat(aFocusedEntities);

                /*
                 * internal recursive function to find its neighboring nodes
                 */
                var _findNeighborsTop10 = function findNeighbors(oNode, aLinks, aaAllNeighbors) {
                    if (!oNode) {
                        return [];
                    }
                    if (!aaAllNeighbors) {
                        aaAllNeighbors = {};
                    }

                    var aNeighbors = [];
                    var aaNeighbors = {};
                    aLinks.forEach(function(oLink) {
                        if (oLink) {
                            if (oLink.source && oLink.source.id === oNode.id && !aaAllNeighbors[oLink.target.id]) {
                                aaNeighbors[oLink.target.id] = oLink.target;
                            }
                            if (oLink.target && oLink.target.id === oNode.id && !aaAllNeighbors[oLink.source.id]) {
                                aaNeighbors[oLink.source.id] = oLink.source;
                            }
                        }
                    });

                    var oNeighbor;
                    for ( var key in aaNeighbors) {
                        oNeighbor = aaNeighbors[key];

                        aNeighbors.push(oNeighbor);
                        aaAllNeighbors[oNeighbor.id] = oNeighbor;
                        // call the same function recursively
                        // use the internal name
                        aNeighbors = aNeighbors.concat(findNeighbors(oNeighbor, aLinks, aaAllNeighbors));
                    }

                    return aNeighbors;
                };

                // find the top 10
                var aTop10Selected = [];
                aFocusedEntities.forEach(function(oFocusedEntity) {
                    oFocusedEntity.alertsCnt = that.getRelatedAlertsTop10(oFocusedEntity, aLinks).length;
                    aTop10Selected.push(oFocusedEntity);
                });
                aTop10Selected.sort(function(a, b) {
                    return b.alertsCnt - a.alertsCnt;
                });

                sap.ui.getCore().getModel("Top10Model").setProperty("/all", aFocusedEntities.sort(function(a, b) {
                    return b.alertsCnt - a.alertsCnt;
                }));
                var aTop10NodesAndNeighbors = [];
                var aSelected = sap.ui.getCore().getModel("Top10Model").getProperty("/selected");
                if (aSelected && aSelected.length > 0) {
                    aTop10Selected = [];
                    aSelected.forEach(function(oSelected) {
                        // they are not the same type of object anymore
                        aTop10Selected.push(aaFocusedEntities[oSelected.id]);
                    });
                    // remove nodes&&links which are not connected to the top 10
                    // aTop10NodesAndNeighbors =
                    // aTop10NodesAndNeighbors.concat(aTop10Selected);

                    aTop10Selected.forEach(function(oNode) {
                        aTop10NodesAndNeighbors = aTop10NodesAndNeighbors.concat(_findNeighborsTop10(oNode, aLinks));
                    });

                    // remove the broken links between Investigation and Alerts
                    var aaTop10NodesAndNeighbors = {};
                    aTop10NodesAndNeighbors.forEach(function(oNode) {
                        aaTop10NodesAndNeighbors[oNode.id] = oNode;
                    });

                    aTop10NodesAndNeighbors = [];
                    for ( var id in aaTop10NodesAndNeighbors) {
                        aTop10NodesAndNeighbors.push(aaTop10NodesAndNeighbors[id]);
                    }
                } else if (!oEvent) {
                    aTop10NodesAndNeighbors = aNodes;
                    sap.ui.getCore().getModel("Top10Model").setProperty("/selected", aTop10NodesAndNeighbors);
                    sap.ui.getCore().getModel("Top10Model").refresh(true);
                }

                // if (bTop10) {
                // // initialize the top 10 if not done
                // var aSelected = sap.ui.getCore().getModel("Top10Model").getProperty("/selected");
                // if (aSelected && aSelected.length > 0) {
                // aTop10Selected = [];
                // aSelected.forEach(function(oSelected) {
                // // they are not the same type of object anymore
                // aTop10Selected.push(aaFocusedEntities[oSelected.id]);
                // });
                //
                // } else {
                // aTop10Selected = aTop10Selected.slice(0, 10);
                // sap.ui.getCore().getModel("Top10Model").setProperty("/selected", aTop10Selected);
                // sap.ui.getCore().getModel("Top10Model").refresh(true);
                // }
                // // remove nodes&&links which are not connected to the top 10
                // // aTop10NodesAndNeighbors =
                // // aTop10NodesAndNeighbors.concat(aTop10Selected);
                //
                // aTop10Selected.forEach(function(oNode) {
                // aTop10NodesAndNeighbors = aTop10NodesAndNeighbors.concat(_findNeighborsTop10(oNode, aLinks));
                // });
                //
                // // remove the broken links between Investigation and Alerts
                // var aaTop10NodesAndNeighbors = {};
                // aTop10NodesAndNeighbors.forEach(function(oNode) {
                // aaTop10NodesAndNeighbors[oNode.id] = oNode;
                // });
                //
                // aTop10NodesAndNeighbors = [];
                // for ( var id in aaTop10NodesAndNeighbors) {
                // aTop10NodesAndNeighbors.push(aaTop10NodesAndNeighbors[id]);
                // }
                // // aLinks.forEach(function(oLink, idx) {
                // // // if (oLink.source.type === "Investigation") {
                // // if (!aaTop10NodesAndNeighbors[oLink.source.id]) {
                // // // remove it from the list
                // // aLinks.splice(idx, 1);
                // // }
                // // if (!aaTop10NodesAndNeighbors[oLink.target.id]) {
                // // // remove it from the list
                // // aLinks.splice(idx, 1);
                // // }
                // // // }
                // // });
                // } else {
                // aTop10NodesAndNeighbors = aNodes;
                // sap.ui.getCore().getModel("Top10Model").setProperty("/selected", []);
                // sap.ui.getCore().getModel("Top10Model").refresh(true);
                // }

                return {
                    nodes : aTop10NodesAndNeighbors,
                    links : aLinks
                };
            },

            findNeighborsTop10 : function(oNode, aLinks) {
                var aNeighbors = [];
                var aaNeighbors = {};
                aLinks.forEach(function(oLink) {
                    if (oLink && oLink.source.id === oNode.id) {
                        aaNeighbors[oLink.target.id] = oLink.target;
                    }
                    if (oLink && oLink.target.id === oNode.id) {
                        aaNeighbors[oLink.source.id] = oLink.source;
                    }
                });
                for ( var key in aaNeighbors) {
                    aNeighbors.push(aaNeighbors[key]);
                }
                return aNeighbors;
            },

            findAllNeighborsTop10 : function(oEntity, aLinks) {
                var that = this;
                var aaNeighbors = {};
                var aNeighbors = [];
                if (oEntity) {
                    // find alerts in max 2 levels deep
                    that.findNeighborsTop10(oEntity, aLinks).forEach(function(oNode) {
                        that.findNeighborsTop10(oNode, aLinks).forEach(function(oNode2) {
                            if (!aaNeighbors.hasOwnProperty(oNode2.id)) {
                                aaNeighbors[oNode2.id] = "";
                                aNeighbors.push(oNode2);
                            }
                        });
                        if (!aaNeighbors.hasOwnProperty(oNode.id)) {
                            aaNeighbors[oNode.id] = "";
                            aNeighbors.push(oNode);
                        }
                    });
                }
                return aNeighbors;
            },

            getRelatedAlertsTop10 : function(oEntity, aLinks) {
                var that = this;
                var aAlertNumbers = [];
                if (oEntity) {
                    // find alerts in max 2 levels deep
                    that.findNeighborsTop10(oEntity, aLinks).forEach(function(oNode) {
                        if (oNode.type !== "Alert") {
                            that.findNeighborsTop10(oNode, aLinks).forEach(function(oNode2) {
                                if (oNode2.type === "Alert") {
                                    aAlertNumbers.push(oNode2.name);
                                }
                            });
                        } else {
                            aAlertNumbers.push(oNode.name);
                        }
                    });
                }
                return aAlertNumbers;
            },

            getRelatedAlerts : function(oEntity) {

                var that = this;
                var aAlertNumbers = [];
                if (oEntity) {
                    // find alerts in max 2 levels deep
                    that._ETDEntityGraph.findNeighbors(oEntity).forEach(function(oNode) {
                        if (oNode.type !== "Alert") {
                            that._ETDEntityGraph.findNeighbors(oNode).forEach(function(oNode2) {
                                if (oNode2.type === "Alert") {
                                    aAlertNumbers.push(oNode2.name);
                                }
                            });
                        } else {
                            aAlertNumbers.push(oNode.name);
                        }
                    });
                }
                return aAlertNumbers;
            },

            triggerNodePress : function(sNodeId, bFireEvent) {
                this._ETDEntityGraph.triggerNodePress(sNodeId, bFireEvent);
            },

        });
