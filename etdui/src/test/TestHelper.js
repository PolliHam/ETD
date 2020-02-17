jQuery.sap.declare("test.TestHelper");


test.TestHelper = {
    __ManagedObjectMethods : ["addAggregation", "addAssociation", "applySettings", "attachFormatError", "attachParserError",
        "attachValidationError", "attachValidationSuccess", "bindAggregation", "bindContext", "bindObject", "bindProperty",
        "destroyAggregation", "detachFormatError", "detachParserError", "detachValidationError", "detachValidationSuccess",
        "findAggregatedObjects", "fireFormatError", "fireValidationError", "fireValidationSuccess", "getAggregation", "getAssociation",
        "getBinding", "getBindingContext", "getBindingInfo", "getBindingPath", "getEventingParent", "getId", "getModel", "getObjectBinding",
        "getOriginInfo", "getParent", "getProperty", "hasModel", "indexOfAggregation", "insertAggregation", "isBound", "setProperty",
        "unbindAggregation", "unbindContext", "unbindObject", "unbindProperty", "validateAggregation", "valiadateProperty"],
    __ElementMethdos : ["addCustomData", "addDependent", "addEventDelegate", "applyFocusInfo", "bindElement", "data", "destroy"],
    createMockView : function() {
        var view = jasmine.createSpyObj("view", [ "setModel", "byId", "addStyleClass", "getModel", "getController", "getId", "addDependent" , "createId", "bindElement", "getBindingContext", "getElementBinding"]);
        return view;
    },
    createMockBindingContext : function() {
        var  bindingContext = jasmine.createSpyObj("bindingContext", [ "getProperty", "getModel", "getPath", "getObject" ]);
        return bindingContext;
    },
    createMockControl : function() {
        var control = jasmine.createSpyObj("control", [ "setValueState", "getSelected", "setValue", "setText", "setVisible", "getVisible", "getColumns", "bindItems", "getBinding", "getBindingContext",
            "attachEventOnce", "getItems", "setBusy", "getValue", "setSelectedItem", "getSelectedItem", "attachParseError", "attachValidationError", "attachValidationSuccess",
            "setEnabled"]);
        return control;
    },
    createMockEvent : function() {
        var event = jasmine.createSpyObj("event", [ "getParameter", "getSource", "getParameters" ]);
        return event;
    },
    createMockRouter : function() {
        var router = jasmine.createSpyObj("router", [ "attachRoutePatternMatched", "navTo", "attachRouteMatched" ]);
        return router;
    },
    createMockComponent : function(methods) {
        var component = jasmine.createSpyObj("component", methods || [ "getCsrfToken", "getModel", "getNavigationVetoCollector" ]);
        return component;
    },
    createMockModel : function() {
        var model = jasmine.createSpyObj("model", [ "getData", "setData", "getServiceMetadata", "getProperty", "setSizeLimit", "read", "getResourceBundle", "attachRequestCompleted" ]);
        return model;
    },
    createMockResourceBundle : function() {
        return jasmine.createSpyObj("resourceBundle", ["getText"]);
    },
    createMockDialog : function(parentView, model) {
        var dialog = jasmine.createSpyObj("dialog", [ "setModel", "open", "close", "focus", "getModel", "getParent" ]);
        if (parentView) {
            dialog.getParent.and.returnValue(parentView);
        }
        if (model) {
            dialog.getModel.and.returnValue(model);
        }
        return dialog;
    },
    createMockTextBundle : function() {
        return jasmine.createSpyObj("textBundle", ["getText"]);
    },
    createMockPromise : function() {
        var promise = jasmine.createSpyObj("promise", ["done", "fail", "error"]);
        promise.done.and.returnValue(promise);
        promise.fail.and.returnValue(promise);
        promise.error.and.returnValue(promise);
        return promise;
    }
};