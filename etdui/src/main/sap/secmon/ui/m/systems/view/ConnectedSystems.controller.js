/* globals d3 */
sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.systems.view.ConnectedSystems", {

    SERVICE_URL : "/sap/secmon/services/ui/m/systems/systemConnections.xsjs",

    DEFAULT_FROM : "00:00",

    DEFAULT_TO : "23:59",

    DEFAULT_DIRECTIONS : "all",

    constructor : function() {
        sap.secmon.ui.m.commons.EtdController.apply(this, arguments);
    },

    onInit : function() {
        var view = this.getView();
        var oController = this;
        this.uiModel = new sap.ui.model.json.JSONModel({
            from : this.DEFAULT_FROM,
            to : this.DEFAULT_TO,
            day : new Date(),
            loading : true,
            directions : this.DEFAULT_DIRECTIONS,
            nodes : [],
            links : []
        });
        view.setModel(this.uiModel, "uiModel");

        this.forceDirectedGraph = this.getView().byId("forceDirectedGraph");
        this.forceDirectedGraph.setLinkDistance(function(link, index) {
            return oController.getLinkDistance(link.weight);
        });
        this.forceDirectedGraph.setLinkFactory(function(linkElement) {
            var link = linkElement.append("line").attr("class", "sapEtdSystemLink").style("stroke-width", function(link) {
                return oController.getLinkWidth(link.weight);
            });
            return link;
        });
        this.forceDirectedGraph.setNodeFactory(function(nodeElement) {
            var fontSize = 40, node = nodeElement.append("g").attr("class", "sapEtdSystemNode");

            node.append("rect").attr("width", fontSize * 0.9).attr("height", fontSize * 0.5).attr("fill", "white").attr("transform", "translate(" + fontSize * -0.45 + "," + fontSize * -0.26 + ")")
                    .append("title").text(function(node) {
                        if (typeof node.connections === "number") {
                            return node.name + " (" + node.connections + ")";
                        }
                        return node.name;
                    });

            // SAP-icon e159 is the icon it-instance
            node.append("text").attr("font-family", "SAP-icons").attr("font-size", fontSize).text("\ue159").attr("transform", "translate(" + fontSize * -0.5 + "," + fontSize * 0.5 + ")");

            // Node Text
            node.append("text").attr("dx", function(node, index) {
                return 30;
            }).attr("dy", function(node, index) {
                return index === 0 ? ".0em" : ".5em";
            }).text(function(d) {
                return d.name;
            });

            return node;
        });
        
        this.forceDirectedGraph.setEnableCollisionDetection(true);
        this.forceDirectedGraph.setCharge(-200);
    },

    beforeRendering : function(oEvent) {
    },

    onUpdatePress : function() {
        if (this.validInput()) {
            this.updateData();
        } else {
            sap.m.MessageToast.show(this.getText("MSystems_InvalidInput"));
        }
    },

    /**
     * Validates the State of the 'from' and 'to' Inputs.
     * 
     * @return {Boolean} Returns true if all inputs are in a valid state, false otherwise.
     */
    validInput : function() {
        var inputs = [ this.getView().byId("fromInput"), this.getView().byId("toInput") ];
        var valid = true;
        jQuery.each(inputs, function(i, input) {
            if (sap.ui.core.ValueState.Error === input.getValueState()) {
                valid = false;
                return false;
            }
        });
        return valid;
    },

    /**
     * Resets the 'uiModel' to the application defaults and updates the graph.
     */
    onResetPress : function() {
        this.resetDateTime();
        this.uiModel.setProperty("/directions", this.DEFAULT_DIRECTIONS);
        this.updateData();
    },

    resetDateTime : function() {
        var now = new Date();
        this.uiModel.setProperty("/day", now);
        this.uiModel.setProperty("/from", this.DEFAULT_FROM);
        this.uiModel.setProperty("/to", this.DEFAULT_TO);
    },

    /**
     * date : Date(), time : HH:MM
     */
    getDateFromDateAndTime : function(date, time) {
        if (this.UTC() === true) {
            return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), time.split(":")[0], time.split(":")[1], 0));
        } else {
            return new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.split(":")[0], time.split(":")[1], 0);
        }
    },

    /**
     * Updates the data according to the current filter information in the 'uiModel' and handles the ajax Promise. If a request is still pending it will be aborted and a new request will be started.
     */
    updateData : function() {
        var controller = this;

        controller.uiModel.setProperty("/loading", true);

        if (this.isRequestPending(this.ajaxPromise)) {
            this.ajaxPromise.abort();
        }

        this.ajaxPromise = this.loadSystemConnections().done($.proxy(this.createGraphData, this)).always(function() {
            controller.uiModel.setProperty("/loading", false);
        }).fail(function(promise) {
            if (promise.statusText !== "abort") {
                sap.m.MessageBox.alert(controller.getText("MConnectedSys_Error"), {
                    title : controller.getCommonText("Error_TIT")
                });
            }
        });
    },

    /**
     * Returns true if the given object is a jQuery Promise in state "pending".
     */
    isRequestPending : function(promise) {
        return (typeof promise === "object") && (jQuery.isFunction(promise.promise)) && (promise.state() === "pending");
    },

    /**
     * Loads the system connections according to the current filter information in the 'uiModel'.
     * 
     * @return {Promise} ajaxPromise
     */
    loadSystemConnections : function() {
        var systemId = this.uiModel.getProperty("/systemId");
        var from = this.uiModel.getProperty("/from");
        var to = this.uiModel.getProperty("/to");
        var day = this.uiModel.getProperty("/day");

        var fromDate = this.getDateFromDateAndTime(day, from);
        var toDate = this.getDateFromDateAndTime(day, to);

        return $.ajax({
            url : this.SERVICE_URL + "?systemId=" + systemId + "&from=" + fromDate.getTime() + "&to=" + toDate.getTime()
        });
    },

    /**
     * Creates nodes[] and links[] out of the server response in order to render the force-directed graph.
     */
    createGraphData : function(data) {
        var systemConnections = data.systemConnections;
        var systemId = this.uiModel.getProperty("/systemId");
        var nodeRadius = this.getView().GRAPH_NODE_RADIUS;

        var nodes = [], links = [];

        // create centered node for watched system:
        nodes.push({
            name : systemId,
            centered : true,
            fixed : true,
            radius : nodeRadius
        });

        var weightFunction = this.createWeightFunction();

        systemConnections.forEach(function(value, index) {

            var weight = weightFunction(value.incoming, value.outgoing);

            if (weight === 0) {
                return;
            }

            nodes.push({
                name : value.system,
                connections : weight,
                radius : nodeRadius
            });

            links.push({
                source : 0,
                target : links.length + 1,
                weight : weight
            });
        });

        this.renderGraph(nodes, links);
    },

    /**
     * Creates the weight calculation function depending on the selected directions.
     */
    createWeightFunction : function() {
        var selectedDirections = this.uiModel.getProperty("/directions");

        if (selectedDirections === "all") {
            return function(incoming, outgoing) {
                return incoming + outgoing;
            };
        } else if (selectedDirections === "incoming") {
            return function(incoming, outgoing) {
                return incoming;
            };
        } else if (selectedDirections === "outgoing") {
            return function(incoming, outgoing) {
                return outgoing;
            };
        }
    },

    /**
     * Creates the 'linkWidthFunction' and the 'distanceFunction' according to the given links and nodes. Then updates the model and the graph.
     */
    renderGraph : function(nodes, links) {
        var nodeWidth = 75; // approx. width of an image node w. Text
        var minLinkDistance = nodeWidth;
        var maxLinkDistance = (this.getView().GRAPH_WIDTH / 2) - nodeWidth;
        var minLinkWidth = 1.5, maxLinkWidth = 8; // px

        var linkWeights = links.map(function(link) {
            return link.weight;
        });

        var minLinkWeight = Math.min.apply(null, linkWeights), maxLinkWeight = Math.max.apply(null, linkWeights);

        this.getLinkWidth = d3.scale.linear().domain([ minLinkWeight, maxLinkWeight ]).range([ minLinkWidth, maxLinkWidth ]);
        this.getLinkDistance = d3.scale.linear().domain([ minLinkWeight, maxLinkWeight ]).range([ maxLinkDistance, minLinkDistance ]);

        this.uiModel.setProperty("/nodes", nodes);
        this.uiModel.setProperty("/links", links);
        this.getView().byId("forceDirectedGraph").start();
    },

    /**
     * Used to set/change the systemId by other views/controllers.
     */
    setSystem : function(systemId) {
        this.uiModel.setProperty("/systemId", systemId);
        this.resetDateTime();
        this.updateData();
    }

});