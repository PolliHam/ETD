/* globals oTextBundle */
$.sap.declare("sap.secmon.ui.ssm.SystemView");

$.sap.require("sap/ui/thirdparty/d3");
$.sap.require("sap.secmon.ui.ssm.SystemContainer");
$.sap.require("sap.secmon.ui.commons.NavigationHelper");
$.sap.require("sap.secmon.ui.ssm.Constants");
jQuery.sap.require("sap.ui.model.odata.CountMode");
/**
 * Custom control reuses the ObjectHeader control to display attributes of a System as well as a content area showing a list of Systems, which are related to the System in Header. The header area
 * contains Filters and Sorters helping to find Systems needed.
 * 
 * 02.05.2006: Navigation to MornitoringPage thru popup item "ThreadSituation"
 * 
 * @see: SystemContainer.js
 */
sap.ui.core.Control.extend("sap.secmon.ui.ssm.SystemView", {

    metadata : {
        properties : {
            height : {
                type : "string",
                defaultValue : "100%"
            },
            title : {
                type : "object"
            },
            history : {
                type : "object"
            },
            viewMode : {
                type : "string"
            },
        },

        aggregations : {
            _root : {
                type : "sap.m.ObjectHeader",
                multiple : false,
                visibility : "hidden"
            }
        },

        events : {
            navigate : {
                operation : "string",
                source : "string"
            }
        }
    },

    _systemMiniView : undefined,
    _ssmContent : undefined,
    _oConfigPopover : undefined,
    _oNavigationHelper : new sap.secmon.ui.commons.NavigationHelper(3600),

    _icons : {
        filters : [ {
            // count : 20,
            icon : "sap-icon://folder-full",
            text : oTextBundle.getText("SSM_All_LBL"),
            key : "All",
            condition : function(d) {
                return true;
            },
            tooltip : oTextBundle.getText("SSM_All_TOL")
        }, {
            count : 0,
            icon : "sap-icon://alert",
            iconColor : "Critical",
            text : oTextBundle.getText("SSM_HighImpact_LBL"),
            key : "Critical",
            condition : function(d) {
                return d.Criticality >= 50;
            },
            tooltip : oTextBundle.getText("SSM_HighImpact_TOL")
        }, {
            count : 0,
            icon : "sap-icon://favorite",
            iconColor : "Positive",
            text : oTextBundle.getText("SSM_Healthy_LBL"),
            key : "Healthy",
            condition : function(d) {
                return d.Health < 50;
            },
            tooltip : oTextBundle.getText("SSM_Healthy_TOL")
        }, {
            count : 0,
            icon : "sap-icon://alert",
            iconColor : "Neutral",
            text : oTextBundle.getText("SSM_LowImpact_LBL"),
            key : "Uncritical",
            condition : function(d) {
                return d.Criticality < 50;
            },
            tooltip : oTextBundle.getText("SSM_LowImpact_TOL")
        }, {
            count : 0,
            icon : "sap-icon://accidental-leave",
            iconColor : "Negative",
            text : oTextBundle.getText("SSM_Unhealthy_LBL"),
            key : "Unhealthy",
            condition : function(d) {
                return d.Health >= 50;
            },
            tooltip : oTextBundle.getText("SSM_Unhealthy_TOL")
        }, {
            icon : "sap-icon://vertical-grip",
        }, {
            icon : "sap-icon://sort",
            iconColor : "Neutral",
            text : "\u21C5 " + oTextBundle.getText("SSM_Name_LBL"),
            key : "Id",
            tooltip : oTextBundle.getText("SSM_Name_TOL")
        }, {
            icon : "sap-icon://sort",
            iconColor : "Critical",
            text : "\u21C5 " + oTextBundle.getText("SSM_IOC_LBL"),
            key : "Criticality",
            tooltip : oTextBundle.getText("SSM_IOC_TOL")
        }, {
            icon : "sap-icon://sort",
            iconColor : "Positive",
            text : "\u21C5 " + oTextBundle.getText("SSM_SOC_LBL"),
            key : "Health",
            tooltip : oTextBundle.getText("SSM_SOC_TOL")
        }, {
            icon : "sap-icon://sort",
            text : "\u21C5 " + oTextBundle.getText("SSM_Role_LBL"),
            key : "Role",
            tooltip : oTextBundle.getText("SSM_Role_TOL")
        }, ]

    },

    setViewMode : function(sViewMode) {
        this.viewMode = sViewMode;
        this.getModel().refresh(true);
    },

    init : function() {
        // attribute distribution as default model
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.loadData("/sap/secmon/ui/ssm/defaultEtdLandscape.json", null, false);
        // setup the icons
        oModel.setProperty("/icons", this._icons);
        oModel.setProperty("/Criticality", 0);
        oModel.setProperty("/Health", 0);

        this.setModel(oModel);

        this.setHistory([]);

        this._ssmContent = new sap.secmon.ui.ssm.SystemContainer({
            // width : this.getWidth(),
            navigate : [ function(oEvent) {
                var oNavigation = oEvent.getParameter("navigation");
                var sRela = oNavigation.Name;
                var oSource = oEvent.getParameter("source");

                // set data for the associations
                var oFilter = {
                    entity : {
                        id : "RelatedObjects",
                        keys : [ {
                            name : "SourceId",
                            value : oSource.Id
                        }, {
                            name : "SourceType",
                            value : oSource.Type
                        // }, {
                        // name : "SourceEntityType",
                        // value : oSource.EntityType
                        } ],
                        properties : oSource
                    },
                    relation : {
                        name : sRela
                    }
                };
                this.getHistory().push(oFilter);
                this._prepareData(oFilter);

                // set icon select to "All"
                this._root.getHeaderContainer().setSelectedKey("All");
                var oIconAll = this._root.getHeaderContainer().getItems()[0];
                this.lastItemIdWithCount = oIconAll.getId();

            }, this ]
        });

        this._ssmContent.setModel(oModel);

        // System View Header
        var that = this;
        this._root = new sap.m.ObjectHeader({
            responsive : true,
            fullScreenOptimized : false,
            // icon : sap.ui.core.IconPool.getIconURI("undo"),// ("nav-back"),
            iconActive : true,
            iconPress : [ function(oEvent) {
                var aHistory = this.getHistory();
                if (aHistory.length <= 1) {
                    return;
                }
                aHistory.pop();
                var oFilter = aHistory[aHistory.length - 1];
                this._prepareData(oFilter);
            }, this ],
            icon : {
                path : "/name",
                formatter : function(sVal) {
                    var aHistory = that.getHistory();
                    return aHistory && aHistory.length > 1 ? sap.ui.core.IconPool.getIconURI("undo") : null;
                }
            },
            number : {
                path : "/Status",
                formatter : function(sVal) {
                    if (sVal === undefined || sVal === null) {
                        return ""; // show nothing
                    }
                    // var sViewMode = that.getViewMode();
                    // return (sViewMode === C_SSM_VIEW_MODE.NOTES ? "CVSS: " :
                    // "Status: ") + sVal;
                    return (sVal.indexOf("Active") >= 0 ? "Status: " : "CVSS: ") + sVal;
                }
            },
            numberState : {
                path : "/Status",
                formatter : function(sVal) {
                    if (sVal === undefined || null) {
                        return;
                    }

                    if (sVal.indexOf("Active") >= 0) {
                        return sVal === "Active" ? sap.ui.core.ValueState.Success : sap.ui.core.ValueState.Error;
                    } else {
                        if (+sVal >= 9) {
                            return sap.ui.core.ValueState.Error;
                        } else if (+sVal >= 7.0) {
                            return sap.ui.core.ValueState.Warning;
                        } else if (+sVal >= 4.0) {
                            return sap.ui.core.ValueState.None;
                        } else {
                            return sap.ui.core.ValueState.Success;
                        }
                    }

                }
            },
            backgroundDesign : "Translucent",
            statuses : [ new sap.m.ProgressIndicator({
                visible : true,
                enabled : true,
                tooltip : oTextBundle.getText("SSM_IOC_LBL"),
                // barColor : sap.ui.core.BarColor.NEUTRAL,
                displayValue : {
                    path : "/Criticality",
                    formatter : function(iVal) {
                        if (iVal < 0 || iVal > 100) {
                            this.toggleStyleClass("sapEtdBackgroundLightBlue", false);
                            return oTextBundle.getText("SSM_NA_LBL");
                        } else {
                            this.toggleStyleClass("sapEtdBackgroundLightBlue", true);
                            return oTextBundle.getText("SSM_IOC_LBL") + ': ' + iVal + '%';
                        }
                    }
                },
                percentValue : {
                    path : "/Criticality",
                    formatter : function(iVal) {
                        return iVal < 0 || iVal > 100 ? 0 : iVal;
                    }
                },
                state : "None",
                showValue : true,
                height : '22px', // 1.375rem
                width : '320px'
            }), new sap.m.ProgressIndicator({
                visible : true,
                enabled : true,
                tooltip : oTextBundle.getText("SSM_SOC_LBL"),
                // barColor : sap.ui.core.BarColor.NEGATIVE,
                displayValue : {
                    path : "/Health",
                    formatter : function(iVal) {
                        if (iVal < 0 || iVal > 100) {
                            this.toggleStyleClass("sapEtdBackgroundGreen", false);
                            return oTextBundle.getText("SSM_NA_LBL");
                        } else {
                            this.toggleStyleClass("sapEtdBackgroundGreen", true);
                            return oTextBundle.getText("SSM_SOC_LBL") + ': ' + iVal + '%';
                        }
                    }
                },
                percentValue : {
                    path : "/Health",
                    formatter : function(iVal) {
                        return iVal < 0 || iVal > 100 ? 0 : iVal;
                    }
                },

                state : "Error",
                showValue : true,
                height : '22px', // 1.375rem
                width : '320px'
            }) ],
            attributes : {
                path : "/attributes",
                factory : function(sId, oContext) {
                    var sAttrName = oModel.getProperty(oContext.sPath).name;
                    return new sap.m.ObjectAttribute({
                        title : "{name}",
                        // text : "{value}",
                        text : {
                            path : "value",
                            formatter : function(sVal) {
                                // remove the HTML tags
                                if (sVal) {
                                    return sVal.indexOf("<div") >= 0 ? $(sVal).text() : sVal;
                                } else {
                                    return "null";
                                }
                            }
                        },
                        active : sAttrName === "Symptom" || sAttrName === "Solution",
                        visible : !(sAttrName === "SourceType" || sAttrName === "SourceId" || sAttrName === "Id"),
                        press : [ function(oEvent) {
                            // create popover
                            this._oPopover = sap.ui.xmlfragment("sap.secmon.ui.ssm.DetailsPopover", this);
                            var path = oEvent.getSource().oBindingContexts.undefined.sPath.slice(-1);
                            var attribute = oEvent.getSource().oBindingContexts.undefined.oModel.oData.attributes[path];
                            this._oPopover.addContent(new sap.ui.core.HTML({
                                content : attribute.value,
                                sanitizeContent : true
                            }));
                            this._oPopover.openBy(oEvent.getSource());
                        }, this ]
                    });
                },
            },

            headerContainer : new sap.m.IconTabBar({
                expandable : false,
                expanded : true,
                // stretchContentHeight : true,
                items : {
                    path : "/icons/filters",
                    factory : function(sId, oContext) {
                        var oUIControl = null;
                        var sIcon = oModel.getProperty(oContext.sPath).icon;
                        if (sIcon === "sap-icon://vertical-grip") {
                            oUIControl = new sap.m.IconTabSeparator({
                                icon : "{icon}"
                            });
                        } else {
                            oUIControl = new sap.m.IconTabFilter({
                                count : {
                                    path : "count",
                                    formatter : function(sVal) {
                                        return sVal !== undefined && sVal !== null ? sVal : null;
                                    }
                                },
                                icon : "{icon}",
                                iconColor : "{iconColor}",
                                text : "{text}",
                                key : "{key}",
                                tooltip : "{tooltip}"
                            });

                        }
                        return oUIControl;
                    }
                },
                content : this._ssmContent,

                select : [ function(oEvent) {
                    if (oEvent.getParameter("item").getCount()) {
                        // tab css modification
                        if (this.lastItemIdWithCount) {
                            if (this.lastItemIdWithCount !== oEvent.getParameter("item").sId) {
                                $("#" + this.lastItemIdWithCount).removeClass("sapMITBSelected");
                                this.lastItemIdWithCount = oEvent.getParameter("item").sId;
                            }
                        } else {
                            this.lastItemIdWithCount = oEvent.getParameter("item").sId;
                        }

                        // action
                        this._handleFilterChange(oEvent);

                    } else {
                        // tab css modification
                        this._handleSorterChange(oEvent);
                        $("#" + this.lastItemIdWithCount).addClass("sapMITBSelected");
                        $("#" + oEvent.getParameter("item").sId).removeClass("sapMITBSelected");
                        // action
                    }
                }, this ]
            }),
            title : "{/name}",
            titleActive : true,
            // titleActive : {
            // path : "/name",
            // formatter : function(sVal) {
            // var aHistory = that.getHistory();
            // return !(that.getViewMode() === C_SSM_VIEW_MODE.SYSTEMS &&
            // (aHistory && aHistory.length <= 1));
            // }
            // },

            intro : {
                path : "/description",
                formatter : function(sVal) {
                    // remove the HTML tags
                    return sVal && sVal.indexOf("<div") >= 0 ? $(sVal).text() : sVal;
                }
            },
            titlePress : [ function(oEvent) {
                // create popover
                var oDetailsTable = new sap.ui.table.Table({
                    // width : "100%",
                    visibleRowCount : {
                        path : "/attributes",
                        formatter : function(aVals) {
                            if (aVals === undefined) {
                                return 1;
                            } else {
                                return aVals.length;
                            }
                        }
                    },
                    selectionMode : sap.ui.table.SelectionMode.None,
                    columnHeaderVisible : true,
                });
                oDetailsTable.addColumn(new sap.ui.table.Column({
                    width : "100px",
                    label : new sap.ui.commons.Label({
                        text : "{i18n>SSM_Colum_Name_LBL}"
                    }),
                    template : new sap.ui.commons.TextView({
                        text : "{name}"
                    }),

                }));

                oDetailsTable.addColumn(new sap.ui.table.Column({
                    label : new sap.ui.commons.Label({
                        text : "{i18n>SSM_Colum_Des_LBL}"
                    }),
                    template : new sap.ui.core.HTML({
                        content : {
                            path : "value",
                            formatter : function(value) {
                                return value && value.indexOf("<div") >= 0 ? value : '<div class="left">' + value + '</div>';
                            }
                        },
                        sanitizeContent : true
                    }),
                }));

                var oModel = this.getModel();
                oDetailsTable.setModel(oModel);
                oDetailsTable.bindRows("/attributes");

                var oPopover = new sap.m.Popover({
                    title : "{i18n>SSM_TitlePop_Title}",
                    placement : "Bottom",
                    content : oDetailsTable,
                });
                oPopover.openBy(oEvent.getSource().getDomRef().childNodes[0].childNodes[0].childNodes[0]);
            }, this ],

        });

        this.setAggregation("_root", this._root);
    },

    // renderer : {}, // default renderer

    renderer : function(oRm, oControl) {
        oRm.renderControl(oControl.getAggregation("_root"));
    },

    // onBeforeRendering : function() {
    // //
    // this.getAggregation("_root").setHeight(this.getHeight());
    // },
    //
    // onAfterRendering : function() {
    // },

    _handleFilterChange : function(oEvent) {
        this._ssmContent._handleFilterChange(oEvent);
    },

    /*
     * Event handler for sorting
     */
    _handleSorterChange : function(oEvent) {
        this._ssmContent._handleSorterChange(oEvent);
    },

    handleConfigSelect : function(oEvent) {
        var oItem = oEvent.getParameter("listItem");
        this._root.setTitle(oItem.getTitle());

        var oBindingContext = oItem.getBindingContext();
        this._root.setBindingContext(oBindingContext);

        var sId = this.getModel().getProperty(oBindingContext.getPath()).Id;
        var oFilter = {
            entity : {
                id : sId,
                properties : undefined
            },
            relation : sId === "TopLevelSystems" ? {
                name : "SubSystem"
            } : null
        };

        this.getHistory().push(oFilter);
        this._prepareData(oFilter);
        this._oConfigPopover.close();
    },

    _updateCounts : function(oModel) {

        this._icons.filters.forEach(function(oFilter, i) {
            if (oFilter.condition) {
                oFilter.count = (oFilter.condition ? oModel.getProperty("/associations").filter(oFilter.condition) : oModel.getProperty("/associations")).length;
            }
        });
    },

    _handleThreatSituation : function() {
        var dEndTimestamp = new Date(Date.now());
        var sTo = sap.secmon.ui.ssm.utils.formatDateTime(dEndTimestamp);
        var sFrom = sap.secmon.ui.ssm.utils.formatDateTime(new Date(dEndTimestamp.getTime() - 90 * 24 * 3600 * 1000));

        this._oNavigationHelper.navigate({
            newWindow : true,
            url : "/sap/secmon/ui/monitoring/",
            data : {
                "id" : "Vx2Sf9snNzriAC3iG1ZQ1g==",
                "period" : {
                    "operator" : "BETWEEN",
                    "searchTerms" : [ sFrom, sTo ]
                },
                "filters" : [ {
                    "key" : "54F913D5CCC44E8AE10000000A4CF109",
                    "valueRange" : {
                        "operator" : "IN",
                        "searchTerms" : [ "DBACOCKPIT" ],
                        "searchTermRefKeys" : []
                    }
                } ]
            }

        }, function() {
        }, function() {
        }, true);
    },

    _prepareData : function(oFilter) {

        if (oFilter.relation && oFilter.relation.name === "ThreatSituation") {
            this._handleThreatSituation();
            return;
        }

        var that = this;
        var oModel = this.getModel();

        // fetch the attributes and do the conversion if
        // necessary
        var aFilters = [];
        (oFilter.entity.keys || []).forEach(function(d, i) {
            aFilters.push(new sap.ui.model.Filter({
                path : d.name,
                operator : sap.ui.model.FilterOperator.EQ,
                value1 : d.value,
            }));
        });

        if (oFilter.relation) {
            aFilters.push(new sap.ui.model.Filter({
                path : "Relation",
                operator : sap.ui.model.FilterOperator.EQ,
                value1 : oFilter.relation.name,
            }));
        }

        var sResource = oFilter.entity.id;

        // reset the model
        oModel.setProperty("/associations", []);

        var sService = "/sap/secmon/services/SSM.xsodata";
        var oMainSysODataModel = new sap.ui.model.odata.ODataModel(sService, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        oMainSysODataModel.read("/" + sResource, {
            urlParameters : [ "$format=json" ],
            filters : aFilters,
            success : function(oData, oResponse) {
                var aSystems = JSON.parse(oResponse.body).d.results;
                aSystems.forEach(function(d, i) {
                    d.id = d.Id;
                    d.name = d.Id;
                    d.type = d.Type;
                    // convert Health & Criticality to integer
                    d.Health = +d.Health;
                    d.Criticality = +d.Criticality;
                });

                oModel.setProperty("/associations", aSystems);

                // update count of filter icons
                that._updateCounts(oModel);
                oModel.refresh();

                // refresh doesn't work since we don't have binding!
                that._ssmContent.forceRerender();
            },
            error : function(oError) {
                sap.secmon.ui.ssm.utils.getController().reportNotification(sap.ui.core.MessageType.Error, oError.message);
            }
        });

        // attributes
        var aaAttrMap = {
            "ImpactOfCompromise" : "Criticality",
            "StatusOfCompromise" : "Health"
        };
        var oSystem;
        if (oFilter.entity.properties === undefined) {
            // add the default landscape data
            var iConfig = 0;
            oModel.getProperty("/configs").some(function(d, i) {
                if (d.Id === oFilter.entity.id) {
                    iConfig = i;
                    return true;
                }
            });
            oSystem = oModel.getProperty("/configs")[iConfig];

            oMainSysODataModel = new sap.ui.model.odata.ODataModel(sService, {
                json : true,
                defaultCountMode : sap.ui.model.odata.CountMode.Inline
            });
            oMainSysODataModel.read("/Attributes", {
                urlParameters : [ "$format=json" ],
                filters : [ new sap.ui.model.Filter({
                    path : "Type",
                    operator : sap.ui.model.FilterOperator.EQ,
                    value1 : "EntryPoint",
                }), new sap.ui.model.Filter({
                    path : "Name",
                    operator : sap.ui.model.FilterOperator.EQ,
                    value1 : "Landscape",
                }) ],
                success : function(oData, oResponse) {
                    // Currently we have only Health & Criticality
                    JSON.parse(oResponse.body).d.results.forEach(function(d, i) {
                        oModel.setProperty("/" + aaAttrMap[d.AttrName], +d.AttrValue);
                    });

                    oModel.setProperty("/id", "Landscapes");
                    // oModel.setProperty("/Id", "Landscapes");
                    // oModel.setProperty("/name", "Landscapes");
                    // oModel.setProperty("/description", null);
                    // oModel.refresh();
                },
                error : function(oError) {
                    sap.secmon.ui.ssm.utils.getController().reportNotification(sap.ui.core.MessageType.Error, oError.message);
                }
            });

        } else {
            oSystem = oFilter.entity.properties;
        }

        // fetch other attributes for SecurityNotes
        oMainSysODataModel = new sap.ui.model.odata.ODataModel(sService, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        oMainSysODataModel.read("/Attributes", {
            urlParameters : [ "$format=json" ],
            filters : [ new sap.ui.model.Filter({
                // path : "EntityType",
                // operator : sap.ui.model.FilterOperator.EQ,
                // value1 : oSystem.EntityType,
                // }), new sap.ui.model.Filter({
                path : "Type",
                operator : sap.ui.model.FilterOperator.EQ,
                value1 : oSystem.Type,
            }), new sap.ui.model.Filter({
                path : "Name",
                operator : sap.ui.model.FilterOperator.EQ,
                value1 : oSystem.Id,
            }) ],
            success : function(oData, oResponse) {
                var aAttributes = [], attr;
                oModel.setProperty("/title", undefined);
                oModel.setProperty("/ShortDescription", undefined);
                oModel.setProperty("/ReasonPrerequisites", undefined);
                oModel.setProperty("/CVSSBaseScore", undefined);
                JSON.parse(oResponse.body).d.results.forEach(function(d, i) {
                    if (d.AttrName !== "ShortDescription" && d.AttrName !== "ReasonPrerequisites" && d.AttrName !== "CVSSBaseScore") {
                        aAttributes.push({
                            name : d.AttrDisplayName,
                            value : d.AttrValue
                        });
                    } else {
                        oModel.setProperty("/" + d.AttrName, d.AttrValue);
                    }
                });

                for (attr in oSystem) {
                    if (!(attr === "__metadata" || typeof oSystem[attr] === "object" || attr.charAt(0) === attr.charAt(0).toLowerCase())) {
                        if (attr === "Status" || attr === "Criticality" || attr === "Health" || attr === "Name") {
                            oModel.setProperty("/" + attr, oSystem[attr]);
                        } else {
                            aAttributes.push({
                                name : attr,
                                value : oSystem[attr]
                            });
                        }
                    }
                }

                oModel.setProperty("/id", oSystem.Id);
                oModel.setProperty("/Id", oSystem.Id);
                oModel.setProperty("/name", oSystem.Id);

                oModel.setProperty("/description", oModel.getProperty("/ReasonPrerequisites") || "");
                oModel.setProperty("/title", oModel.getProperty("/ShortDescription") || "");
                oModel.setProperty("/Status", oModel.getProperty("/CVSSBaseScore") || oSystem.Status);

                oModel.setProperty("/attributes", aAttributes);

                var sTitle = oModel.getProperty("/title");
                oModel.setProperty("/name", oModel.getProperty("/Id") + (sTitle ? ": " + oModel.getProperty("/title") : ""));

            },
            error : function(oError) {
                sap.secmon.ui.ssm.utils.getController().reportNotification(sap.ui.core.MessageType.Error, oError.message);
            }
        });

        return this;
    }
});