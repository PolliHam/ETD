jQuery.sap.declare("sap.secmon.ui.domainrating.DomainForceDirectedGraph");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.controls.ForceDirectedGraph");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.secmon.ui.m.commons.controls.LinkOrText");
jQuery.sap.require("sap.secmon.ui.commons.RelatedEventsHelper");

sap.secmon.ui.commons.controls.ForceDirectedGraph.extend("sap.secmon.ui.domainrating.DomainForceDirectedGraph", {

    COLOR_VERY_HIGH : "#A50F15",
    COLOR_HIGH : "#E52929",
    COLOR_MEDIUM : "#F27020",

    COLOR_WHITE : "white",
    LEGEND_COLOR_SHAPES : "#9E9E9E",

    COLOR_MAC_ADDRESS : "black",
    COLOR_HOST_NAME : "rgb(217, 152, 203)",
    COLOR_USER : "rgb(250, 195, 100)",
    COLOR_IP : "rgb(92, 186, 230)",
    COLOR_URL : "lightslategray",
    COLOR_EVENT : "green",

    C_NODE_TYPE : {
        IP : "IP",
        URL : "Url",
        USER : "User",
        HOST_NAME : "Hostname",
        MAC_ADDRESS : "MACAddress",
        EVENT : "Event"
    },
    C_NODE_TYPE_MAP : {
        "IP" : {
            color : this.COLOR_IP,
            size : 10
        },
        "Url" : {
            color : this.COLOR_URL,
            size : 20
        },
        "User" : {
            color : this.COLOR_USER,
            size : 6
        },
        "Hostname" : {
            color : this.COLOR_HOST_NAME,
            size : 5
        },
        "MACAddress" : {
            color : this.COLOR_MAC_ADDRESS,
            size : 5
        },
        "Event" : {
            color : this.COLOR_EVENT,
            size : 5
        }
    },

    metadata : {
        properties : {
            data : {
                type : "any"
            },
            height : {
                type : "string",
                defaultValue : "1000px"
            },
            showLegend : {
                type : "boolean",
                defaultValue : true
            }
        }
    },

    nodeDetails : {},

    init : function() {

        // call super.init()
        sap.secmon.ui.commons.controls.ForceDirectedGraph.prototype.init.apply(this, arguments);
        var oControl = this;
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

        this.setLinkDistance(50);
        this.setCharge(-300);
        this.setEnableDragging(true);
        this.setTooltip(tooltip);
        this.setEnableCollisionDetection(true);
        this.setNodeFactory(this._nodeFactory.bind(this));
        this.attachNodePress(this.onNodePress);
        this.attachPress(this.onPress);
    },
    createGraphData : function(data) {
        var that = this;
        var aEvents = data.Urls;

        // nodes
        var aNodes = [];
        // links
        var aLinks = [];
        var aIds;

        aIds = [ {
            key : "Domain",
            type : this.C_NODE_TYPE.URL
        }, {
            key : "Event",
            type : this.C_NODE_TYPE.URL
        }, {
            key : "NetworkIPAddressInitiator",
            type : this.C_NODE_TYPE.IP
        }, // Client
        {
            key : "NetworkMACAddressInitiator",
            type : this.C_NODE_TYPE.MAC_ADDRESS
        } // MAC
        ];
        var key, obj, aaNodes = {};
        aEvents.forEach(function(url) {
            aIds.forEach(function(oId) {
                key = url[oId.key];
                if (!aaNodes[key]) {
                    obj = {
                        id : key,
                        kb : oId.key,
                        value : +url["COUNT(*)[0]"],
                        type : oId.type,
                        name : that._getDisplayName(oId.type),
                        radius : that.C_NODE_TYPE_MAP[oId.type].size
                    };
                    aNodes.push(obj);
                    aaNodes[key] = obj;
                }
            });
            // if(aIds[1].key && aIds[0].key)
            aLinks.push({
                source : aaNodes[url[aIds[1].key]],
                target : aaNodes[url[aIds[0].key]],
                value : +url["COUNT(*)[0]"]
            });

            // links to MAC only if MAC exists
            // if(aIds[1].key && aIds[2].key)
            aLinks.push({
                source : aaNodes[url[aIds[1].key]],
                target : aaNodes[url[aIds[2].key]],
                value : +url["COUNT(*)[0]"]
            });
        });

        // user data
        aIds = [ {
            key : "56424E1F1B2FA51BE22A044B51CC7B4D",
            type : this.C_NODE_TYPE.IP
        }, // Client
        {
            key : "56424E7F1B2FA51BE22A044B51CC7B4D",
            type : this.C_NODE_TYPE.USER
        } // User
        ];
        var aUsers = data.Users;
        if (aUsers) {
            aUsers.forEach(function(usr) {
                aIds.forEach(function(oId) {
                    key = usr[oId.key];
                    if (!aaNodes[key]) {
                        obj = {
                            id : key,
                            kb : oId.key,
                            type : oId.type,
                            name : that._getDisplayName(oId.type),
                            radius : that.C_NODE_TYPE_MAP[oId.type].size
                        };
                        aNodes.push(obj);
                        aaNodes[key] = obj;
                    }
                });
                aLinks.push({
                    source : aaNodes[usr[aIds[0].key]],
                    target : aaNodes[usr[aIds[1].key]],
                    value : usr["COUNT(*)[0]"]
                });
            });
        }
        // MAC Address, Host
        aIds = [ {
            key : "56424E1F1B2FA51BE22A044B51CC7B4D",
            type : this.C_NODE_TYPE.IP
        }, // Client
        {
            key : "56424E231B2FA51BE22A044B51CC7B4D",
            type : this.C_NODE_TYPE.MAC_ADDRESS
        }, // MAC
        {
            key : "53CDE6170DC572EEE10000000A4CF109",
            type : this.C_NODE_TYPE.HOST_NAME
        } // Host
        ];
        var aMacHosts = data.Hosts;
        if (aMacHosts) {
            aMacHosts.forEach(function(mh, n) {
                if (aaNodes[mh[aIds[0].key]]) {
                    aIds.forEach(function(oId) {
                        key = mh[oId.key];
                        if (!aaNodes[key]) {
                            obj = {
                                id : key,
                                kb : oId.key,
                                type : oId.type,
                                name : that._getDisplayName(oId.type),
                                radius : that.C_NODE_TYPE_MAP[oId.type].size
                            };
                            aNodes.push(obj);
                            aaNodes[key] = obj;
                        }
                    });
                    aLinks.push({
                        source : aaNodes[mh[aIds[0].key]],
                        target : aaNodes[mh[aIds[1].key]],
                        value : mh["COUNT(*)[0]"]
                    });
                    aLinks.push({
                        source : aaNodes[mh[aIds[0].key]],
                        target : aaNodes[mh[aIds[2].key]],
                        value : mh["COUNT(*)[0]"]
                    });
                }
            });
        }
        this.setNodes(aNodes);
        this.setLinks(aLinks);
    },
    _getDisplayName : function(type) {
        var displayName;
        switch (type) {
        case this.C_NODE_TYPE.IP:
            displayName = 'IP Address ';
            break;
        case this.C_NODE_TYPE.MAC_ADDRESS:
            displayName = 'MAC Address';
            break;
        case this.C_NODE_TYPE.HOST_NAME:
            displayName = 'Device Name';
            break;
        case this.C_NODE_TYPE.USER:
            displayName = 'User Pseudonym';
            break;
        case this.C_NODE_TYPE.URL:
            displayName = 'Domain';
            break;
        }
        return displayName;
    },
    getTooltipItemsForNode : function(node) {
        var sLabel = "";
        sLabel = this._getDisplayName(node.type) + ": ";
        var sValue = 'No value';
        if (node.id) {
            sValue = node.id;
        }
        var aTooltipItems = [ new sap.secmon.ui.commons.controls.TooltipItem({
            leftContent : new sap.m.Label({
                text : sLabel
            }),
            rightContent : new sap.m.Text({
                text : sValue
            })
        }) ];

        if (node.type === this.C_NODE_TYPE.IP) {
            aTooltipItems.push(new sap.secmon.ui.commons.controls.TooltipItem({
                leftContent : new sap.m.Label({
                    text : "Count: "
                }),
                rightContent : new sap.m.Text({
                    text : node.value
                })
            }));
        }

        return aTooltipItems;
    },

    _nodeFactory : function(nodeElement) {
        var oControl = this;

        var node = nodeElement.append("g");
        node.filter(function(d) {
            return d.type === oControl.C_NODE_TYPE.URL;
        }).append("circle").attr("r", function(d) {
            return d.radius;
        }).attr("fill", function(d) {
            switch (d.type) {
            case oControl.C_NODE_TYPE.URL:
                return oControl.COLOR_URL;
            case oControl.C_NODE_TYPE.IP:
                return oControl.COLOR_IP;
            case oControl.C_NODE_TYPE.MAC_ADDRESS:
                return oControl.COLOR_MAC_ADDRESS;
            case oControl.C_NODE_TYPE.HOST_NAME:
                return oControl.COLOR_HOST_NAME;
            case oControl.C_NODE_TYPE.USER:
                return oControl.COLOR_USER;
            }
        }).attr("stroke-width", function(d) {
            return "1";
        }).attr("stroke", function(d) {
            return "#9ecae1";
        }).attr("class", "sapEtdAlertCircleNode");

        // rect node for IP
        node.filter(function(d) {
            return d.type === oControl.C_NODE_TYPE.IP;
        }).append("rect").attr("width", 25).attr("height", 25).attr("fill", "white").attr("x", function(d) {
            return -12;
        }).attr("y", function(d) {
            return -12;
        }).attr("stroke-width", function(d) {
            return "1";
        }).attr("stroke", function(d) {
            return oControl.COLOR_IP;
        }).attr("class", "sapEtdAlertCircleNode");

        node.append('text').attr('text-anchor', 'middle').attr('dominant-baseline', 'central').attr('font-family', "SAP-icons").attr('font-size', function(d) {
            if (d.type === oControl.C_NODE_TYPE.URL) {
                return '35px';
            } else {
                return '20px';
            }
        }).attr("fill", function(d) {
            switch (d.type) {
            case oControl.C_NODE_TYPE.IP:
                return oControl.COLOR_IP;
            case oControl.C_NODE_TYPE.MAC_ADDRESS:
                return oControl.COLOR_MAC_ADDRESS;
            case oControl.C_NODE_TYPE.HOST_NAME:
                return oControl.COLOR_HOST_NAME;
            case oControl.C_NODE_TYPE.USER:
                return oControl.COLOR_USER;
            case oControl.C_NODE_TYPE.URL:
                return 'white';
            }
        }).text(function(d) {
            switch (d.type) {
            case oControl.C_NODE_TYPE.USER:
                return '\ue0ca';
            case oControl.C_NODE_TYPE.IP:
                return "IP";
            case oControl.C_NODE_TYPE.MAC_ADDRESS:
                return '\ue027';
            case oControl.C_NODE_TYPE.HOST_NAME:
                return '\ue15a';
            default:
                return '\ue091';
            }
        });

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

    onBeforeRendering : function() {
        var data = this.getData();
        if (!data) {
            return;
        }
        if ($.isEmptyObject(data)) {
            return;
        }
        this.createGraphData(data);
    }

});
