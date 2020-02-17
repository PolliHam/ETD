/* globals d3 */
jQuery.sap.declare("sap.secmon.ui.commons.controls.AlertForceDirectedGraph");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.controls.ForceDirectedGraph");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.secmon.ui.m.commons.controls.LinkOrText");
jQuery.sap.require("sap.ui.model.odata.CountMode");
jQuery.sap.require("sap.secmon.ui.commons.RelatedEventsHelper");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/commons/controls/css/AlertForceDirectedGraph.css");
sap.secmon.ui.commons.controls.ForceDirectedGraph.extend("sap.secmon.ui.commons.controls.AlertForceDirectedGraph", {

    SYSTEM_TYPE : "System",
    PATTERN_TYPE : "Pattern",
    TERMINAL_TYPE : "Terminal",
    USER_TYPE : "User",
    PATTERN_LINK_TYPE : "PatternLink",
    SYSTEM_LINK_TYPE : "SystemLink",
    TERMINAL_LINK_TYPE : "TerminalLink",
    USER_LINK_TYPE : "UserLink",
    CIRCLE_MIN : 5,
    CIRCLE_MAX : 30,
    SYMBOL_CIRCLE_MIN : 15,
    SYMBOL_CIRCLE_MAX : 40,
    SYMBOL_TERMINAL_MIN : 20,
    SYMBOL_TERMINAL_MAX : 50,
    SYMBOL_PATTERN_MIN : 20,
    SYMBOL_PATTERN_MAX : 50,
    SYMBOL_SYSTEM_MIN : 20,
    SYMBOL_SYSTEM_MAX : 50,
    SYMBOL_USER_MIN : 20,
    SYMBOL_USER_MAX : 50,
    COLOR_VERY_HIGH : "#A50F15",
    COLOR_HIGH : "#E52929",
    COLOR_MEDIUM : "#F27020",
    COLOR_LOW : "#F0AB00",
    COLOR_PATTERN : "rgb(217, 152, 203)",
    COLOR_USER : "rgb(250, 195, 100)",
    COLOR_SYSTEM : "rgb(92, 186, 230)",
    COLOR_TERMINAL : "rgb(182, 217, 87)",
    COLOR_WHITE : "white",
    LEGEND_COLOR_SHAPES : "#9E9E9E",
    SYSTEMKEY : "/sap/secmon/services/SystemKey.xsodata/",

    metadata : {

        properties : {
            /**
             * Expected Alert Object structure: <code>
             * -------------------------------------
             * AlertCreationTimestamp: "/Date(1427460984886)
             * AlertId:          "VRUsclI/aaXhAAAACkzxCQ=="
             * AlertProcessor: ""
             * AlertSeverity:"HIGH"
             * AlertStatus: "OPEN"
             * Count: "2"
             * -------------------------------------
             * PatternId:"VMgzs98062nhAAAACkzxCQ=="
             * PatternName:"LOG_IS_SYSTEM_LOG"
             * PatternNamespace: "tralala"
             * -------------------------------------
             * SystemId:"Q7Q/002"
             * -------------------------------------
             * TerminalId: "10.67.67.243"
             * -------------------------------------
             * UserId: "OXKRJ-58670"
             * -------------------------------------
             * </code>
             */
            alertData : {
                type : "object[]",
                defaultValue : []
            },
            height : {
                type : "string",
                defaultValue : "1000px"
            },
            showLegend : {
                type : "boolean",
                defaultValue : true
            },
            enableAlertFSNavigation : {
                type : "boolean",
                defaultValue : true
            },
            filterKeys : {
                type : "object",
                defaultValue : {
                    user : true,
                    terminal : true,
                    system : true,
                    pattern : true,
                    color : false,
                    symbol : true
                }
            },
            centerKeys : {
                type : "object",
                defaultValue : {
                    user : false,
                    terminal : false,
                    system : false,
                    pattern : true
                }
            },
            /**
             * 
             * alertFilter are needed to filter the same supported attribute in AlertFS
             * 
             * The Array must contain objects that look like e.g. <code>
             * { 
             *      Name:"status",
             *      Value: "OPEN"
             *  } 
             * except for "creationDate", because it gives a time range, therefore two values are needed
             * The "creationDate" object must look like
             * {
             *      Name:"creationDate",
             *      Value:  <timeFrom>
             *      Value2: <timeTo>
             *  </code>
             * 
             * If an attribute is used more than once then several objects must be added to the Array. If one attribute exists more than once the different attribute values are linked with OR, while
             * the different attributes are linked with AND.
             * 
             * Supported Names are: "creationDate","status", "attack", "severity","processor","number","measureContext", "plConfidentiality","plIntegritySystem","plIntegrityData","plAvailability",
             * "psConfidentiality","psConfidentiality","psIntegritySystem","psIntegrityData","psAvailability"
             * 
             * "patternId" is not needed, because it is given when clicking the patternnode
             */
            alertFilter : {
                type : "object[]",
                defaultValue : []
            },
        },

    },

    nodeDetails : {},
    systemKey : [],
    oTextBundle : null,
    oCommonTextBundle : null,

    init : function() {

        this.oTextBundle = jQuery.sap.resources({
            url : "/sap/secmon/ui/commons/controls/i18n/UIText.hdbtextbundle",
            locale : sap.ui.getCore().getConfiguration().getLanguage()
        });

        this.oCommonTextBundle = jQuery.sap.resources({
            url : "/sap/secmon/ui/CommonUIText.hdbtextbundle",
            locale : sap.ui.getCore().getConfiguration().getLanguage()
        });
        // call super.init()
        sap.secmon.ui.commons.controls.ForceDirectedGraph.prototype.init.apply(this, arguments);
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        var oControl = this;

        sap.ui.core.IconPool.addIcon("Pattern", "ETDCustomIcons", {
            fontFamily : "SAP-icons-TNT",
            content : "e026"
        });

        var tooltip = new sap.secmon.ui.commons.controls.Tooltip({
            beforeShow : function(oEvent) {
                // Create and set the tooltip content
                var tooltip = this, node = oEvent.getParameter("source"), tooltipItems = oControl.getTooltipItemsForNode(node);

                // clean up old content
                tooltip.removeAllItems();
                tooltipItems.forEach(function(tooltipItem) {
                    tooltip.addItem(tooltipItem);
                });
            }
        });

        this.setLinkDistance(120);
        this.setCharge(-500);
        this.setEnableDragging(true);
        this.setTooltip(tooltip);
        this.setEnableCollisionDetection(true);
        this.setNodeFactory(this._nodeFactory.bind(this));
        this.attachNodePress(this.onNodePress);
        this.attachPress(this.onPress);
    },

    createGraphData : function() {
        var alerts = this.handleDateFormat(this.getAlertData());

        // variables for determining if a system, user or
        // terminal is related to
        // an alert which is produced from a event-pattern
        // (pattern uses only
        // log-events as data-source)
        var mAlertsBasedOnLogsOnly = {}, mSystemToAlert = {}, mTerminalToAlert = {}, mUserToAlert = {}, nodes = [], links = [], patterns = [], systems = [], terminals = [],

        users = [], patternLinks = [], systemLinks = [], terminalLinks = [], userLinks = [], oControl = this, oFilterKeys = this.getFilterKeys(), oCenterKeys = this.getCenterKeys(), targetType = [];

        // determine min/max timestamps for links to forensic
        // lab and logviewer
        this.minMaxTimestamps = this.calculateMinMaxTimestamps(alerts);

        if (oCenterKeys.pattern) {
            targetType.push(oControl.PATTERN_TYPE);
        }
        if (oCenterKeys.system) {
            targetType.push(oControl.SYSTEM_TYPE);
        }
        if (oCenterKeys.terminal) {
            targetType.push(oControl.TERMINAL_TYPE);
        }
        if (oCenterKeys.user) {
            targetType.push(oControl.USER_TYPE);
        }

        // pattern can currently not be set in settings,
        // therefore enable always
        oFilterKeys.pattern = true;
        if (alerts.length > 0 && !alerts[0].hasOwnProperty("SystemLink")) {
            var systemModel = new sap.ui.model.odata.ODataModel(this.SYSTEMKEY, {
                json : true,
                defaultCountMode : sap.ui.model.odata.CountMode.Inline
            });
            systemModel.read("SystemKey", {
                async : false,
                success : function(response) {
                    oControl.systemKey = response.results;
                },
            });
        }

        alerts.forEach(function(value, index) {
            if (value.MeasureContext === "Log") {
                mAlertsBasedOnLogsOnly[value.AlertId] = true;
            }

            if (oFilterKeys.pattern === true) {

                if (value.PatternId && typeof value.PatternId === "string") {
                    patterns.push({
                        Type : oControl.PATTERN_TYPE,
                        Id : value.PatternId,
                        PatternName : value.PatternName,
                        PatternNamespace : value.PatternNamespace,
                        Score : value.Score,
                        MaxScore : value.Score,
                        MinTimestamp : value.MinTimestamp,
                        MaxTimestamp : value.MaxTimestamp,
                        AlertId : value.AlertId,
                        AlertCount : 0,
                        CircleSize : 0
                    });
                    patternLinks = oControl.getNodeLink(oControl.PATTERN_LINK_TYPE, value, oCenterKeys, patternLinks);
                }
            }

            if (oFilterKeys.system === true) {
                // avoid null values
                if (value.SystemId) {
                    var systemLink = false, systemType;
                    if (value.hasOwnProperty("SystemLink") && typeof value.SystemLink === "string") {
                        systemLink = true;
                        systemType = value.SystemType;
                    } else {
                        oControl.systemKey.some(function(system) {
                            if (system.Id === value.SystemId) {
                                systemLink = true;
                                systemType = value.SystemType;
                                return true;
                            }
                        });

                    }
                    systems.push({
                        Type : oControl.SYSTEM_TYPE,
                        Id : value.SystemId,
                        SystemType : systemType,
                        Link : systemLink,
                        Score : value.Score,
                        MaxScore : value.Score,
                        MinTimestamp : value.MinTimestamp,
                        MaxTimestamp : value.MaxTimestamp,
                        AlertId : value.AlertId,
                        AlertCount : 0,
                        CircleSize : 0
                    });
                    systemLinks = oControl.getNodeLink(oControl.SYSTEM_LINK_TYPE, value, oCenterKeys, systemLinks);

                    // system->alert
                    if (!mSystemToAlert.hasOwnProperty(value.SystemId)) {
                        mSystemToAlert[value.SystemId] = {};
                    }
                    mSystemToAlert[value.SystemId][value.AlertId] = value.AlertId;
                }
            }

            if (oFilterKeys.terminal === true) {
                // avoid null values
                if (value.TerminalId) {
                    terminals.push({
                        Type : oControl.TERMINAL_TYPE,
                        Id : value.TerminalId,
                        Score : value.Score,
                        MaxScore : value.Score,
                        MinTimestamp : value.MinTimestamp,
                        MaxTimestamp : value.MaxTimestamp,
                        AlertId : value.AlertId,
                        AlertCount : 0,
                        CircleSize : 0
                    });

                    terminalLinks = oControl.getNodeLink(oControl.TERMINAL_LINK_TYPE, value, oCenterKeys, terminalLinks);

                    // terminal->alert
                    if (!mTerminalToAlert.hasOwnProperty(value.TerminalId)) {
                        mTerminalToAlert[value.TerminalId] = {};
                    }
                    mTerminalToAlert[value.TerminalId][value.AlertId] = value.AlertId;
                }
            }

            if (oFilterKeys.user === true) {
                // avoid null values
                if (value.UserId) {
                    users.push({
                        Type : oControl.USER_TYPE,
                        Id : value.UserId,
                        Score : value.Score,
                        MaxScore : value.Score,
                        MinTimestamp : value.MinTimestamp,
                        MaxTimestamp : value.MaxTimestamp,
                        AlertId : value.AlertId,
                        AlertCount : 0,
                        CircleSize : 0
                    });
                    userLinks = oControl.getNodeLink(oControl.USER_LINK_TYPE, value, oCenterKeys, userLinks);

                    // user->alert
                    if (!mUserToAlert.hasOwnProperty(value.UserId)) {
                        mUserToAlert[value.UserId] = {};
                    }
                    mUserToAlert[value.UserId][value.AlertId] = value.AlertId;
                }
            }

        });

        patterns = this.uniqueArray(patterns);
        patterns = this.setSize(patterns, this.PATTERN_TYPE);
        systems = this.uniqueArray(systems);
        systems = this.setSize(systems, this.SYSTEM_TYPE);
        terminals = this.uniqueArray(terminals);
        terminals = this.setSize(terminals, this.TERMINAL_TYPE);
        users = this.uniqueArray(users);
        users = this.setSize(users, this.USER_TYPE);

        // set variable usableForLogViewer to true if at least
        // one alert is
        // produced from a event-pattern
        systems.forEach(function(oSystem) {
            oSystem.usableForLogViewer = false;

            if (mSystemToAlert[oSystem.Id]) {
                oSystem.usableForLogViewer = Object.keys(mSystemToAlert[oSystem.Id]).some(function(sAlertId) {
                    if (mAlertsBasedOnLogsOnly[sAlertId]) {
                        return true;
                    } else {
                        return false;
                    }
                });
            }
        });

        // set variable usableForLogViewer to true if at least
        // one alert is
        // produced from a event-pattern
        terminals.forEach(function(oTerminal) {
            oTerminal.usableForLogViewer = false;

            if (mTerminalToAlert[oTerminal.Id]) {
                oTerminal.usableForLogViewer = Object.keys(mTerminalToAlert[oTerminal.Id]).some(function(sAlertId) {
                    if (mAlertsBasedOnLogsOnly[sAlertId]) {
                        return true;
                    } else {
                        return false;
                    }
                });
            }
        });

        // set variable usableForLogViewer to true if at least
        // one alert is
        // produced from a event-pattern
        users.forEach(function(oUser) {
            oUser.usableForLogViewer = false;

            if (mUserToAlert[oUser.Id]) {
                oUser.usableForLogViewer = Object.keys(mUserToAlert[oUser.Id]).some(function(sAlertId) {
                    if (mAlertsBasedOnLogsOnly[sAlertId]) {
                        return true;
                    } else {
                        return false;
                    }
                });
            }
        });

        nodes = patterns.concat(systems, terminals, users);
        nodes.sort(this.compareSize);

        patternLinks = this.uniqueArray(patternLinks);
        systemLinks = this.uniqueArray(systemLinks);
        terminalLinks = this.uniqueArray(terminalLinks);
        userLinks = this.uniqueArray(userLinks);

        links = this.createLinks(patternLinks, systemLinks, terminalLinks, userLinks, nodes, targetType);

        this.setNodes(nodes);
        this.setLinks(links);

        var filterKeys = this.getFilterKeys();
        if (filterKeys.color === true) {
            this.setLegend(this.getColorLegend());
        } else if (filterKeys.symbol === true) {
            this.setLegend(this.getSymbolLegend());
        } else {
            this.setShowLegend(false);
        }
    },

    handleDateFormat : function(aAlerts) {
        // forensic lab provides date strings rather than date
        // objects
        var formattedAlerts = [];
        if (aAlerts.length > 1 && typeof aAlerts[0].MinTimestamp === "string") {
            // update inner property
            formattedAlerts = this.formatDateTimes(aAlerts);
            this.setProperty("alertData", formattedAlerts, true);
            return formattedAlerts;
        } else {
            return aAlerts;
        }
    },

    /**
     * Returns an array copy of the given alerts with Date objects rather than Date strings.
     */
    formatDateTimes : function(alerts) {
        var formattedAlerts = [], tmpAlert = {};
        alerts.forEach(function(alert) {
            tmpAlert = alert;
            tmpAlert.AlertCreationTimestamp = new  Date(alert.AlertCreationTimestamp.replace(/\//g, ''));
            tmpAlert.MinTimestamp = new Date(alert.MinTimestamp.replace(/\//g, ''));
            tmpAlert.MaxTimestamp = new Date(alert.MaxTimestamp.replace(/\//g, ''));
            formattedAlerts.push(tmpAlert);
        }, this);
        return formattedAlerts;
    },

    calculateMinMaxTimestamps : function(alerts) {
        var minTimestamp = Number.POSITIVE_INFINITY, maxTimestamp = Number.NEGATIVE_INFINITY;
        alerts.forEach(function(alert) {
            if (alert.MinTimestamp.getTime() < minTimestamp) {
                minTimestamp = alert.MinTimestamp;
            }
            if (alert.MaxTimestamp.getTime() > maxTimestamp) {
                maxTimestamp = alert.MaxTimestamp;
            }
        });
        return {
            minTimestamp : minTimestamp,
            maxTimestamp : maxTimestamp
        };
    },

    compareSize : function(n1, n2) {
        return n2.radius - n1.radius;
    },

    setSize : function(nodes, nodeType) {
        var nodesMap = [], getCircleSize, oFilterKeys = this.getFilterKeys();

        nodes.map(function(value) {
            nodesMap.push(value.Score);
        });

        var that = this;
        if (oFilterKeys.color === true) {
            if (nodes.length === 1 || Math.min.apply(null, nodesMap) === Math.max.apply(null, nodesMap)) {
                nodes.forEach(function(node) {
                    node.radius = that.CIRCLE_MAX;
                });
                return nodes;
            }
            getCircleSize = d3.scale.linear().domain([ Math.min.apply(null, nodesMap), Math.max.apply(null, nodesMap) ]).range([ that.CIRCLE_MIN, that.CIRCLE_MAX ]);
            nodes.forEach(function(node) {
                node.radius = getCircleSize(node.Score);
            });
        } else if (oFilterKeys.symbol === true) {
            var symbolMin, symbolMax;
            if (nodes.length === 1 || Math.min.apply(null, nodesMap) === Math.max.apply(null, nodesMap)) {
                nodes.forEach(function(node) {
                    node.radius = that.SYMBOL_CIRCLE_MAX;
                    if (nodeType === that.PATTERN_TYPE) {
                        node.SymbolSize = that.SYMBOL_PATTERN_MAX;
                    } else if (nodeType === that.TERMINAL_TYPE) {
                        node.SymbolSize = that.SYMBOL_TERMINAL_MAX;
                    } else if (nodeType === that.SYSTEM_TYPE) {
                        node.SymbolSize = that.SYMBOL_SYSTEM_MAX;
                    } else if (nodeType === that.USER_TYPE) {
                        node.SymbolSize = that.SYMBOL_USER_MAX;
                    }
                });
                return nodes;
            }

            getCircleSize = d3.scale.linear().domain([ Math.min.apply(null, nodesMap), Math.max.apply(null, nodesMap) ]).range([ that.SYMBOL_CIRCLE_MIN, that.SYMBOL_CIRCLE_MAX ]);
            if (nodeType === that.PATTERN_TYPE) {
                symbolMin = that.SYMBOL_PATTERN_MIN;
                symbolMax = that.SYMBOL_PATTERN_MAX;
            } else if (nodeType === that.TERMINAL_TYPE) {
                symbolMin = that.SYMBOL_TERMINAL_MIN;
                symbolMax = that.SYMBOL_TERMINAL_MAX;
            } else if (nodeType === that.SYSTEM_TYPE) {
                symbolMin = that.SYMBOL_SYSTEM_MIN;
                symbolMax = that.SYMBOL_SYSTEM_MAX;
            } else if (nodeType === that.USER_TYPE) {
                symbolMin = that.SYMBOL_USER_MIN;
                symbolMax = that.SYMBOL_USER_MAX;
            }

            var getSymbolSize = d3.scale.linear().domain([ Math.min.apply(null, nodesMap), Math.max.apply(null, nodesMap) ]).range([ symbolMin, symbolMax ]);
            nodes.forEach(function(node) {
                node.radius = getCircleSize(node.Score);
                node.SymbolSize = getSymbolSize(node.Score);
            });
        }

        return nodes;
    },

    getNodeLink : function(nodetype, node, center, links) {
        var target = {}, sourceId;

        if (center.pattern) {
            target.Pattern = node.PatternId;
        }
        if (center.system) {
            target.System = node.SystemId;
        }
        if (center.terminal) {
            target.Terminal = node.TerminalId;
        }
        if (center.user) {
            target.User = node.UserId;
        }

        if (nodetype === this.PATTERN_LINK_TYPE) {
            sourceId = node.PatternId;
        } else if (nodetype === this.SYSTEM_LINK_TYPE) {
            sourceId = node.SystemId;
        } else if (nodetype === this.TERMINAL_LINK_TYPE) {
            if (node.TerminalId) {
                sourceId = node.TerminalId;
            } else {
                // avoid links to not existing TerminalId nodes
                return links;
            }
        } else if (nodetype === this.USER_LINK_TYPE) {
            if (node.UserId) {
                sourceId = node.UserId;
            } else {
                // avoid links to not existing System nodes
                return links;
            }
        }

        for ( var key in target) {
            if (target.hasOwnProperty(key)) {
                var obj = target[key];

                // links structure is the same for all links,
                // therefore they can
                // be created generic
                if (key !== nodetype) {
                    links.push({
                        Type : nodetype,
                        Id : sourceId + "-" + obj,
                        SourceId : sourceId,
                        TargetId : obj,
                        TargetType : key
                    });
                }
            }
        }
        return links;
    },

    /**
     * Returns an unique and sorted (by score) representation of the given array which contains only distinct Id properties of the given elements. Sorting is necessary to display smaller nodes on top
     * (instead of behind) larger ones
     */
    uniqueArray : function(sourceArray) {
        var idMap = {}, aUnique = [], indexId = 0, alertIdMap = {}, indexAlertId = 0;
        sourceArray.forEach(function(value, i) {
            if (typeof idMap[value.Id] !== 'number') {
                idMap[value.Id] = indexId;
                alertIdMap[value.AlertId] = indexAlertId;
                value.AlertCount = 1;
                indexAlertId++;
                indexId++;
                aUnique.push(value);
            } else {
                aUnique[idMap[value.Id]].Score += value.Score;

                if (typeof aUnique[idMap[value.Id]].MaxScore === 'number' && aUnique[idMap[value.Id]].MaxScore < value.Score) {
                    aUnique[idMap[value.Id]].MaxScore = value.Score;
                }
                if (typeof aUnique[idMap[value.Id]].MinTimestamp === 'object' && aUnique[idMap[value.Id]].MinTimestamp instanceof Date && aUnique[idMap[value.Id]].MinTimestamp > value.MinTimestamp) {
                    aUnique[idMap[value.Id]].MinTimestamp = value.MinTimestamp;
                }
                if (typeof aUnique[idMap[value.Id]].MaxTimestamp === 'object' && aUnique[idMap[value.Id]].MaxTimestamp instanceof Date && aUnique[idMap[value.Id]].MaxTimestamp < value.MaxTimestamp) {
                    aUnique[idMap[value.Id]].MaxTimestamp = value.MaxTimestamp;
                }
                if (aUnique[idMap[value.Id]].Id === value.Id && alertIdMap[value.AlertId] === undefined) {
                    alertIdMap[value.AlertId] = indexAlertId;
                    indexAlertId++;
                    aUnique[idMap[value.Id]].AlertCount++;
                }
            }
        });
        return aUnique;
    },

    createLinks : function(patternLinks, systemLinks, terminalLinks, userLinks, nodes, targetType) {
        var oControl = this, links = [], targetTypeKey;

        var nodeMap = nodes.map(function(n) {
            return n.Type + "-" + n.Id;
        });
        function getAddLinkFunction(typeName) {
            var type = typeName;

            return function(link, index) {
                if (link.SourceId && link.TargetId && targetTypeKey === link.TargetType) {
                    link.source = nodeMap.indexOf(oControl[type] + "-" + link.SourceId);
                    link.target = nodeMap.indexOf(targetTypeKey + "-" + link.TargetId);
                    links.push(link);
                }
            };
        }
        var addPatternLinkFunction = getAddLinkFunction("PATTERN_TYPE"), addSystemLinkFunction = getAddLinkFunction("SYSTEM_TYPE");
        var addTerminalLinkFunction = getAddLinkFunction("TERMINAL_TYPE"), addUserLinkFunction = getAddLinkFunction("USER_TYPE");
        for ( var key in targetType) {
            if (targetType.hasOwnProperty(key)) {
                targetTypeKey = targetType[key];

                if (targetTypeKey !== oControl.PATTERN_TYPE) {
                    patternLinks.forEach(addPatternLinkFunction);
                }
                if (targetTypeKey !== oControl.SYSTEM_TYPE) {
                    systemLinks.forEach(addSystemLinkFunction);
                }
                if (targetTypeKey !== oControl.TERMINAL_TYPE) {
                    terminalLinks.forEach(addTerminalLinkFunction);
                }
                if (targetTypeKey !== oControl.USER_TYPE) {
                    userLinks.forEach(addUserLinkFunction);
                }
            }
        }

        return links;
    },

    getColorLegend : function() {
        return new sap.secmon.ui.commons.controls.Legend({
            items : [ new sap.secmon.ui.commons.controls.LegendItem({
                text : this.getText("ASG_Legend_Circles"),
                isTitle : true
            }), new sap.secmon.ui.commons.controls.LegendItem({
                icon : new sap.secmon.ui.commons.controls.LegendIcon({
                    color : this.COLOR_PATTERN,
                    type : "circle"
                }),
                text : this.getText("ASG_Legend_Pattern")
            }), new sap.secmon.ui.commons.controls.LegendItem({
                icon : new sap.secmon.ui.commons.controls.LegendIcon({
                    color : this.COLOR_USER,
                    type : "circle"
                }),
                text : this.getText("ASG_Legend_User")
            }), new sap.secmon.ui.commons.controls.LegendItem({
                icon : new sap.secmon.ui.commons.controls.LegendIcon({
                    color : this.COLOR_SYSTEM,
                    type : "circle"
                }),
                text : this.getText("ASG_Legend_System")
            }), new sap.secmon.ui.commons.controls.LegendItem({
                icon : new sap.secmon.ui.commons.controls.LegendIcon({
                    color : this.COLOR_TERMINAL,
                    type : "circle"
                }),
                text : this.getText("ASG_Legend_Terminal")
            }), new sap.secmon.ui.commons.controls.LegendItem({
                text : this.getText("ASG_Legend_Edges"),
                isTitle : true
            }), new sap.secmon.ui.commons.controls.LegendItem({
                text : this.getText("ASG_Legend_Edge_Desc")
            }) ]
        });
    },

    getSymbolLegend : function() {
        return new sap.secmon.ui.commons.controls.Legend({
            items : [ new sap.secmon.ui.commons.controls.LegendItem({
                text : this.getText("ASG_Legend_Colors"),
                isTitle : true
            }), new sap.secmon.ui.commons.controls.LegendItem({
                icon : new sap.secmon.ui.commons.controls.LegendIcon({
                    color : this.COLOR_VERY_HIGH,
                    type : "circle"
                }),
                text : this.getText("ASG_Legend_VeryHigh")
            }), new sap.secmon.ui.commons.controls.LegendItem({
                icon : new sap.secmon.ui.commons.controls.LegendIcon({
                    color : this.COLOR_HIGH,
                    type : "circle"
                }),
                text : this.getText("ASG_Legend_High")
            }), new sap.secmon.ui.commons.controls.LegendItem({
                icon : new sap.secmon.ui.commons.controls.LegendIcon({
                    color : this.COLOR_MEDIUM,
                    type : "circle"
                }),
                text : this.getText("ASG_Legend_Medium")
            }), new sap.secmon.ui.commons.controls.LegendItem({
                icon : new sap.secmon.ui.commons.controls.LegendIcon({
                    color : this.COLOR_LOW,
                    type : "circle"
                }),
                text : this.getText("ASG_Legend_Low")
            }), new sap.secmon.ui.commons.controls.LegendItem({
                text : this.getText("ASG_Legend_Shapes"),
                isTitle : true
            }), new sap.secmon.ui.commons.controls.LegendItem({
                icon : new sap.secmon.ui.commons.controls.LegendIcon({
                    color : this.LEGEND_COLOR_SHAPES,
                    src : "sap-icon://ETDCustomIcons/Pattern",
                }),
                text : this.getText("ASG_Legend_Pattern")
            }), new sap.secmon.ui.commons.controls.LegendItem({
                icon : new sap.secmon.ui.commons.controls.LegendIcon({
                    color : this.LEGEND_COLOR_SHAPES,
                    src : "sap-icon://person-placeholder"
                }),
                text : this.getText("ASG_Legend_User")
            }), new sap.secmon.ui.commons.controls.LegendItem({
                icon : new sap.secmon.ui.commons.controls.LegendIcon({
                    color : this.LEGEND_COLOR_SHAPES,
                    src : "sap-icon://it-instance"
                }),
                text : this.getText("ASG_Legend_System")
            }), new sap.secmon.ui.commons.controls.LegendItem({
                icon : new sap.secmon.ui.commons.controls.LegendIcon({
                    color : this.LEGEND_COLOR_SHAPES,
                    src : "sap-icon://laptop"
                }),
                text : this.getText("ASG_Legend_Terminal")
            }), new sap.secmon.ui.commons.controls.LegendItem({
                text : this.getText("ASG_Legend_Edges"),
                isTitle : true
            }), new sap.secmon.ui.commons.controls.LegendItem({
                text : this.getText("ASG_Legend_Edge_Desc")
            }) ]
        });
    },

    getTooltipItemsForNode : function(node) {
        switch (node.Type) {
        case this.SYSTEM_TYPE:
            return this.getTooltipItemsForSystemNode(node);
        case this.PATTERN_TYPE:
            return this.getTooltipItemsForPatternNode(node);
        case this.TERMINAL_TYPE:
            return this.getTooltipItemsForTerminalNode(node);
        case this.USER_TYPE:
            return this.getTooltipItemsForUserNode(node);
        default:
            break;
        }
    },

    /** Creates the Tooltip items to display for a System node */
    getTooltipItemsForSystemNode : function(node) {
        var aTooltipItems = [ new sap.secmon.ui.commons.controls.TooltipItem({
            leftContent : new sap.m.Label({
                text : this.getText("MAlertGraphInfo_System")
            }),
            rightContent : new sap.secmon.ui.m.commons.controls.LinkOrText({
                text : node.Id,
                linkEnabled : node.Link,
                press : [ this.onDetailsPress, this ]
            })
        }), new sap.secmon.ui.commons.controls.TooltipItem({
            leftContent : new sap.m.Label({
                text : this.getText("MAlertGraphAlertCnt")
            }),
            rightContent : new sap.m.Text({
                text : node.AlertCount
            })
        }), new sap.secmon.ui.commons.controls.TooltipItem({
            leftContent : new sap.m.Label({
                text : this.getText("MAlertGraphMaxSeverity")
            }),
            rightContent : new sap.m.Text({
                text : this.scoreToSeverityFormatter(node.MaxScore)
            })
        }), new sap.secmon.ui.commons.controls.TooltipItem({
            leftContent : new sap.m.Label({
                text : this.getText("MAlertGraphInfo_Score")
            }),
            rightContent : new sap.m.Text({
                text : node.Score
            })
        }) ];

        if (node.usableForLogViewer) {
            aTooltipItems.push(new sap.secmon.ui.commons.controls.TooltipItem({
                leftContent : this.getEventLink()
            }));
        }

        return aTooltipItems;
    },

    /** Creates the Tooltip items to display for a Pattern node */
    getTooltipItemsForPatternNode : function(node) {
        var alertCount;
        if (this.getEnableAlertFSNavigation() === true) {
            alertCount = new sap.m.Link({
                text : node.AlertCount,
                press : [ this.onCountPress, this ]
            });
        } else {
            alertCount = new sap.m.Text({
                text : node.AlertCount
            });
        }

        return [ new sap.secmon.ui.commons.controls.TooltipItem({
            leftContent : new sap.m.Label({
                text : this.getText("MAlertGraphInfo_PatternN")
            }),
            rightContent : new sap.m.Link({
                text : node.PatternName,
                press : [ this.onDetailsPress, this ]
            })
        }), new sap.secmon.ui.commons.controls.TooltipItem({
            leftContent : new sap.m.Label({
                text : this.getText("MAlertGraphInfo_PatternNS")
            }),
            rightContent : new sap.m.Text({
                text : node.PatternNamespace
            })
        }), new sap.secmon.ui.commons.controls.TooltipItem({
            leftContent : new sap.m.Label({
                text : this.getText("MAlertGraphAlertCnt")
            }),
            rightContent : alertCount
        }), new sap.secmon.ui.commons.controls.TooltipItem({
            leftContent : new sap.m.Label({
                text : this.getText("MAlertGraphMaxSeverity")
            }),
            rightContent : new sap.m.Text({
                text : this.scoreToSeverityFormatter(node.MaxScore)
            })
        }), new sap.secmon.ui.commons.controls.TooltipItem({
            leftContent : new sap.m.Label({
                text : this.getText("MAlertGraphInfo_Score")
            }),
            rightContent : new sap.m.Text({
                text : node.Score
            })
        }) ];
    },

    /** Creates the Tooltip items to display for a Terminal node */
    getTooltipItemsForTerminalNode : function(node) {
        var aTooltipItems = [ new sap.secmon.ui.commons.controls.TooltipItem({
            leftContent : new sap.m.Label({
                text : this.getText("MAlertGraphInfo_Terminal")
            }),
            rightContent : new sap.m.Text({
                text : node.Id
            })
        }), new sap.secmon.ui.commons.controls.TooltipItem({
            leftContent : new sap.m.Label({
                text : this.getText("MAlertGraphAlertCnt")
            }),
            rightContent : new sap.m.Text({
                text : node.AlertCount
            })
        }), new sap.secmon.ui.commons.controls.TooltipItem({
            leftContent : new sap.m.Label({
                text : this.getText("MAlertGraphMaxSeverity")
            }),
            rightContent : new sap.m.Text({
                text : this.scoreToSeverityFormatter(node.MaxScore)
            })
        }), new sap.secmon.ui.commons.controls.TooltipItem({
            leftContent : new sap.m.Label({
                text : this.getText("MAlertGraphInfo_Score")
            }),
            rightContent : new sap.m.Text({
                text : node.Score
            })
        }) ];

        if (node.usableForLogViewer) {
            aTooltipItems.push(new sap.secmon.ui.commons.controls.TooltipItem({
                leftContent : this.getEventLink()
            }));
        }

        return aTooltipItems;
    },

    /** Creates the Tooltip items to display for a User node */
    getTooltipItemsForUserNode : function(node) {
        var aTooltipItems = [ new sap.secmon.ui.commons.controls.TooltipItem({
            leftContent : new sap.m.Label({
                text : this.getText("MAlertGraphInfo_User")
            }),
            rightContent : new sap.m.Text({
                text : node.Id
            })
        }), new sap.secmon.ui.commons.controls.TooltipItem({
            leftContent : new sap.m.Label({
                text : this.getText("MAlertGraphAlertCnt")
            }),
            rightContent : new sap.m.Text({
                text : node.AlertCount
            })
        }), new sap.secmon.ui.commons.controls.TooltipItem({
            leftContent : new sap.m.Label({
                text : this.getText("MAlertGraphMaxSeverity")
            }),
            rightContent : new sap.m.Text({
                text : this.scoreToSeverityFormatter(node.MaxScore)
            })
        }), new sap.secmon.ui.commons.controls.TooltipItem({
            leftContent : new sap.m.Label({
                text : this.getText("MAlertGraphInfo_Score")
            }),
            rightContent : new sap.m.Text({
                text : node.Score
            })
        }) ];

        if (node.usableForLogViewer) {
            aTooltipItems.push(new sap.secmon.ui.commons.controls.TooltipItem({
                leftContent : this.getEventLink()
            }));
        }

        return aTooltipItems;
    },

    /**
     * Returns the text value with the given text key from the i18n model.
     */
    getText : function(sTextKey) {
        return this.oTextBundle.getText(sTextKey);
    },

    getCommonText : function(sTextKey) {
        return this.oCommonTextBundle.getText(sTextKey);
    },

    getEventLink : function() {
        return new sap.m.Link({
            text : this.getText("MAlertGraphEvents"),
            press : [ this.onEventsPress, this ]
        });
    },

    /** Opens Pattern/System details */
    onDetailsPress : function() {
        var id = this.nodeDetails.Id;
        var type = this.nodeDetails.Type;
        this.toDetails(type, id);
    },

    /**
     * In-place navigates to the details of the given AnomalyDetection
     */
    toDetails : function(type, id) {
        var detailUrl;
        if (type === this.SYSTEM_TYPE) {
            detailUrl = sap.secmon.ui.m.commons.NavigationService.systemURL(id, this.nodeDetails.SystemType);
        } else if (type === this.PATTERN_TYPE) {
            detailUrl = sap.secmon.ui.m.commons.NavigationService.patternURLWithHexGuid(this.oCommons.base64ToHex(id));
        }
        this.eventDetailsWindow = window.open(detailUrl, "Events");
        this.eventDetailsWindow.focus();
    },

    /** Opens LogViewer */
    onEventsPress : function(oEvent) {
        this.toEventDetails();
    },

    /**
     * In-place navigates to the details of the given entity
     */
    toEventDetails : function() {
        var id = this.nodeDetails.Id;
        var type = this.nodeDetails.Type;

        var from = this.minMaxTimestamps.minTimestamp.getTime();
        var to = this.minMaxTimestamps.maxTimestamp.getTime();

        var sParams = "timeSelectionType=absolute&timeFromDate=" + from + "&timeToDate=" + to + "&orderBy=Timestamp&orderDesc=true";

        if (type === this.SYSTEM_TYPE) {
            sParams += "&SystemIdActor=" + encodeURIComponent(id);
        } else if (type === this.TERMINAL_TYPE) {
            sParams += "&NetworkHostnameInitiator=" + encodeURIComponent(id);
        } else if (type === this.USER_TYPE) {
            sParams += "&UserPseudonymActing=" + encodeURIComponent(id);
        }

        sap.secmon.ui.m.commons.NavigationService.openLogViewerWithParams(sParams, true);
    },

    onCountPress : function(oEvent) {
        this.toAlertFsTable();
    },

    toAlertFsTable : function() {
        var filters = this.getAlertFilter();
        filters.sort(function(a, b) {
            return a.Name.localeCompare(b.Name);
        });
        var filterString = "";
        var lastFilter;
        var timeUsed = false;
        filters.forEach(function(filter) {
            if (filter.Name !== "patternId") {
                if (filter.Name === "creationDate") {
                    if (typeof (filter.Value) === "object" && typeof (filter.Value2) === "object" && filter.Value instanceof Date && filter.Value2 instanceof Date) {
                        filterString = filterString + "&timeSelectionType=absolute&timeFromDate=" + filter.Value.getTime() + "&timeToDate=" + filter.Value2.getTime();
                        timeUsed = true;
                    }
                } else if (lastFilter === filter.Name) {
                    filterString = filterString + "," + filter.Value;
                } else {
                    filterString = filterString + "&" + filter.Name + "=" + filter.Value;
                }
                lastFilter = filter.Name;
            }
        });

        var patternId = this.nodeDetails.Id;
        var hexId = this.oCommons.base64ToHex(patternId);
        var url;
        if (timeUsed === true && filterString.length > 0) {
            url = sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#AlertsList-show&/?orderDesc=false&orderBy=creationDate&patternId=" + hexId + filterString;
        } else {
            url = sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#AlertsList-show&/?orderDesc=false&orderBy=creationDate&patternId=" + hexId + "&timeSelectionType=absolute";
        }

        this.AlertsWindow = window.open(url, "Alerts");
        this.AlertsWindow.focus();
    },

    scoreToSeverityFormatter : function(score) {
        if (score >= 0 && score <= 25) {
            return this.getCommonText("Severity_Low_LBL");
        } else if (score > 25 && score <= 50) {
            return this.getCommonText("Severity_Medium_LBL");
        } else if (score > 50 && score <= 75) {
            return this.getCommonText("Severity_High_LBL");
        } else if (score > 75) {
            return this.getCommonText("Severity_VeryHigh_LBL");
        }
    },

    _nodeFactory : function(nodeElement) {
        var oControl = this;
        var oFilterKeys = oControl.getFilterKeys();

        var node = nodeElement.append("g");

        if (oFilterKeys.color === true) {
            node.append("circle").attr("r", function(node) {
                return node.radius;
            }).attr("fill", function(node) {
                switch (node.Type) {
                case oControl.PATTERN_TYPE:
                    return oControl.COLOR_PATTERN;
                case oControl.TERMINAL_TYPE:
                    return oControl.COLOR_TERMINAL;
                case oControl.SYSTEM_TYPE:
                    return oControl.COLOR_SYSTEM;
                case oControl.USER_TYPE:
                    return oControl.COLOR_USER;
                }

            }).attr("class", "sapEtdAlertCircleNode");
        } else if (oFilterKeys.symbol === true) {
            node.append("circle").attr("r", function(node) {
                return node.radius;
            }).attr("fill", function(node) {
                if (node.MaxScore <= 25) {
                    return oControl.COLOR_LOW;
                } else if (node.MaxScore > 25 && node.MaxScore <= 50) {
                    return oControl.COLOR_MEDIUM;
                } else if (node.MaxScore > 50 && node.MaxScore <= 75) {
                    return oControl.COLOR_HIGH;
                } else if (node.MaxScore > 75) {
                    return oControl.COLOR_VERY_HIGH;
                }

            }).style("opacity", 0.8).attr("class", "sapEtdAlertCircleNode");

            node.append("text").attr("font-family", function(dataNode) {
                if (dataNode.Type === oControl.TERMINAL_TYPE || dataNode.Type === oControl.SYSTEM_TYPE || dataNode.Type === oControl.USER_TYPE) {
                    return "SAP-icons";
                } else if (dataNode.Type === oControl.PATTERN_TYPE) {
                    return "SAP-icons-TNT";
                }
            }).attr('font-size', function(dataNode) {
                return dataNode.SymbolSize;
            }).text(function(dataNode) {
                switch (dataNode.Type) {
                case oControl.PATTERN_TYPE:
                    // pattern icon of custom font family
                    return "\ue026";
                case oControl.TERMINAL_TYPE:
                    return "\ue027"; // laptop
                case oControl.SYSTEM_TYPE:
                    return "\ue159"; // it-instance
                case oControl.USER_TYPE:
                    return "\ue0ca"; // person-placeholder
                }
            }).attr("transform", function(dataNode) {
                var x, y;
                if (dataNode.Type === oControl.PATTERN_TYPE) {
                    x = dataNode.SymbolSize * -0.5;
                    y = dataNode.SymbolSize * 0.5;
                    return "translate(" + x + "," + y + ")";
                } else if (dataNode.Type === oControl.TERMINAL_TYPE) {
                    x = dataNode.SymbolSize * -0.5;
                    y = dataNode.SymbolSize * 0.35;
                    return "translate(" + x + "," + y + ")";
                } else if (dataNode.Type === oControl.SYSTEM_TYPE) {
                    x = dataNode.SymbolSize * -0.5;
                    y = dataNode.SymbolSize * 0.5;
                    return "translate(" + x + "," + y + ")";
                } else if (dataNode.Type === oControl.USER_TYPE) {
                    x = dataNode.SymbolSize * -0.4;
                    y = dataNode.SymbolSize * 0.35;
                    return "translate(" + x + "," + y + ")";
                }
            }).attr("fill", function(node) {
                return oControl.COLOR_WHITE;

            }).style("pointer-events", "none").attr("class", "sapEtdAlertSymbolIconNode");
        }
        return node;
    },

    onNodePress : function(oEvent) {
        // prevent bubbling to 'press' event:
        this.d3.event.stopPropagation();

        var node = oEvent.getParameter("node"), nodeSelection = oEvent.getParameter("nodeSelection"), linkSelection = oEvent.getParameter("linkSelection"), links = this.getLinks(), neighborMap = {};

        // highlight selected nodes and links:
        links.forEach(function(value) {
            if (value.source.index === node.index) {
                neighborMap[value.target.index] = true;
            }
            if (value.target.index === node.index) {
                neighborMap[value.source.index] = true;
            }
        });

        var selectedDomNode = this.d3.selectAll(".sapEtdAlertCircleNode").filter(function(d, i) {
            return d.index === node.index;
        });

        // remove former node highlights
        this.d3.selectAll(".sapEtdAlertCircleNode").classed("selectedNode", false);
        // highlight selected node
        var oFilterKeys = this.getFilterKeys();
        if (oFilterKeys.color === true) {
            selectedDomNode.classed("selectedNode", true);
        }
        if (oFilterKeys.symbol === true) {

            // cleanup before changing the colors.
            // this is needed because otherwise clicking twice
            // the same
            // node has strange results
            var oldSelectedDomNode;
            if (this.d3.selectAll(".selectedNodeVH").size() > 0) {
                oldSelectedDomNode = this.d3.selectAll(".selectedNodeVH");
                oldSelectedDomNode.classed("selectedNodeVH", false);
                oldSelectedDomNode.attr("fill", this.COLOR_VERY_HIGH);
                oldSelectedDomNode.classed("sapEtdAlertCircleNode", true);
            } else if (this.d3.selectAll(".selectedNodeH").size() > 0) {
                oldSelectedDomNode = this.d3.selectAll(".selectedNodeH");
                oldSelectedDomNode.classed("selectedNodeH", false);
                oldSelectedDomNode.attr("fill", this.COLOR_HIGH);
                oldSelectedDomNode.classed("sapEtdAlertCircleNode", true);
            } else if (this.d3.selectAll(".selectedNodeM").size() > 0) {
                oldSelectedDomNode = this.d3.selectAll(".selectedNodeM");
                oldSelectedDomNode.classed("selectedNodeM", false);
                oldSelectedDomNode.attr("fill", this.COLOR_MEDIUM);
                oldSelectedDomNode.classed("sapEtdAlertCircleNode", true);
            } else if (this.d3.selectAll(".selectedNodeL").size() > 0) {
                oldSelectedDomNode.classed("selectedNodeL", false);
                oldSelectedDomNode.attr("fill", this.COLOR_LOW);
                oldSelectedDomNode.classed("sapEtdAlertCircleNode", true);
            }
            var oldselectedIconDomNode = this.d3.selectAll(".selectedIcon");
            if (oldselectedIconDomNode && oldselectedIconDomNode.size() > 0) {
                oldselectedIconDomNode.attr("fill", "#fff");
                oldselectedIconDomNode.classed("selectedIcon", false);
            }

            var selectedIconDomNode = this.d3.selectAll(".sapEtdAlertSymbolIconNode").filter(function(d, i) {
                return d.index === node.index;
            });

            this.d3.selectAll(".sapEtdAlertCircleNode").classed("selectedNodeVH", false);
            this.d3.selectAll(".sapEtdAlertCircleNode").classed("selectedNodeH", false);
            this.d3.selectAll(".sapEtdAlertCircleNode").classed("selectedNodeM", false);
            this.d3.selectAll(".sapEtdAlertCircleNode").classed("selectedNodeL", false);
            this.d3.selectAll(".sapEtdAlertSymbolIconNode").classed("selectedIcon", false);

            var nodeColor = selectedDomNode.attr("fill");

            // this is needed because otherwise the invertion
            // won't work
            // in IE
            nodeColor = nodeColor.toUpperCase();

            selectedDomNode.attr("fill", this.COLOR_WHITE);
            selectedIconDomNode.attr("fill", nodeColor);
            selectedIconDomNode.classed("selectedIcon", true);
            if (nodeColor === this.COLOR_VERY_HIGH) {
                selectedDomNode.classed("selectedNodeVH", true);
            } else if (nodeColor === this.COLOR_HIGH) {
                selectedDomNode.classed("selectedNodeH", true);
            } else if (nodeColor === this.COLOR_MEDIUM) {
                selectedDomNode.classed("selectedNodeM", true);
            } else {
                selectedDomNode.classed("selectedNodeL", true);
            }

        }

        // highlight immediate neighbors
        nodeSelection.style("opacity", function(n) {
            return ((neighborMap[n.index] === true) || (n.index === node.index)) ? 1 : 0.1;
        });

        // highlight related links
        linkSelection.style("opacity", function(l) {
            // don't highlight nodes with the same Id
            // but different Types
            return ((l.source.Id === node.Id && l.source.Type === node.Type) || (l.target.Id === node.Id && l.target.Type === node.Type)) ? 1 : 0.1;
        });

        this.nodeDetails = node;
        this.stop();

    },

    onPress : function(oEvent) {
        // remove highlights
        var nodeSelection = oEvent.getParameter("nodeSelection"), linkSelection = oEvent.getParameter("linkSelection"), selectedDomNode, selectedIconDomNode;
        nodeSelection.style("opacity", 1);
        linkSelection.style("opacity", 1);
        this.d3.selectAll(".selectedNode").classed("selectedNode", false);

        var oFilterKeys = this.getFilterKeys();
        if (oFilterKeys.symbol === true) {
            if (this.d3.selectAll(".selectedNodeVH").size() > 0) {
                selectedDomNode = this.d3.selectAll(".selectedNodeVH");
                selectedDomNode.classed("selectedNodeVH", false);
                selectedDomNode.attr("fill", this.COLOR_VERY_HIGH);
            } else if (this.d3.selectAll(".selectedNodeH").size() > 0) {
                selectedDomNode = this.d3.selectAll(".selectedNodeH");
                selectedDomNode.classed("selectedNodeH", false);
                selectedDomNode.attr("fill", this.COLOR_HIGH);
            } else if (this.d3.selectAll(".selectedNodeM").size() > 0) {
                selectedDomNode = this.d3.selectAll(".selectedNodeM");
                selectedDomNode.classed("selectedNodeM", false);
                selectedDomNode.attr("fill", this.COLOR_MEDIUM);
            } else if (this.d3.selectAll(".selectedNodeL").size() > 0) {
                selectedDomNode = this.d3.selectAll(".selectedNodeL");
                selectedDomNode.classed("selectedNodeL", false);
                selectedDomNode.attr("fill", this.COLOR_LOW);
            }
            selectedIconDomNode = this.d3.selectAll(".selectedIcon");
            if (this.d3.selectAll(".selectedIcon").size() > 0) {
                selectedIconDomNode.attr("fill", this.COLOR_WHITE);
                selectedIconDomNode.classed("selectedIcon", false);
            }
        }

    },

    renderer : {
    // use parent renderer
    },

    setFilterKeys : function(oFilterKeys) {
        this.setProperty("filterKeys", oFilterKeys, true);
        // update legend
        if (oFilterKeys.color === true) {
            this.setLegend(this.getColorLegend());
        } else if (oFilterKeys.symbol === true) {
            this.setLegend(this.getSymbolLegend());
        }
    }

});
