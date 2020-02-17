describe("Master.controller Tests", function(){
	jQuery.sap.require({
		modName : "sap.secmon.ui.m.valuelist.view.Master",
		type : "controller"
	});
	jQuery.sap.require("test.TestHelper");
	var libUnderTest;
	var view, dialog, parentView, errorHandler, bindingContext, router, uicomponent, event;
	afterEach(function() {
	});
	beforeEach(function() {
		 libUnderTest = sap.ui.controller("sap.secmon.ui.m.valuelist.view.Master");
		 view = test.TestHelper.createMockView();
		 dialog = test.TestHelper.createMockDialog();
		 parentView = test.TestHelper.createMockView();
		 bindingContext = test.TestHelper.createMockBindingContext();
		 spyOn(libUnderTest, "getView").and.returnValue(view);
		 dialog.getParent.and.returnValue(view);
		 event = test.TestHelper.createMockEvent();
		 
		 router = test.TestHelper.createMockRouter();
		 spyOn(sap.ui.core.UIComponent, "getRouterFor").and.returnValue(router);
		 sap.ui.Device.system.phone = false;
	});
	it("onInit, check if all subobjects are created for phone", function() {
		sap.ui.Device.system.phone = true;
		var valueListTable = jasmine.createSpyObj("valueListTable", ["removeItem", "bindAggregation", "attachEventOnce"]);
		view.byId.and.returnValue(valueListTable);
		
		libUnderTest.onInit.call(libUnderTest);
		expect(libUnderTest.oCommons).not.toBeUndefined();
		expect(libUnderTest.oRouter).not.toBeUndefined();
		expect(router.attachRoutePatternMatched).toHaveBeenCalled();
		expect(valueListTable.attachEventOnce).not.toHaveBeenCalled();
		expect(libUnderTest.initialLoad).toBeUndefined();
	});
	it("onInit, check if all subobjects are created for non-phones", function() {
		sap.ui.Device.system.phone = false;
		var valueListTable = jasmine.createSpyObj("valueListTable", ["removeItem", "bindAggregation", "attachEventOnce"]);
		view.byId.and.returnValue(valueListTable);
		
		libUnderTest.onInit.call(libUnderTest);
		expect(libUnderTest.oCommons).not.toBeUndefined();
		expect(libUnderTest.oRouter).not.toBeUndefined();
		expect(router.attachRoutePatternMatched).toHaveBeenCalled();
		expect(valueListTable.attachEventOnce).toHaveBeenCalled();
		expect(libUnderTest.initialLoad).toBeTruthy();
	});
	it("onRouteMatched, check if onRouteMatched works correctly for undefined route", function() {
		event.getParameter.and.callFake(function(param) {
			switch(param) {
			case "name" : return "name";
			case "arguments" : return null;
			}
		});
		expect(libUnderTest.onRouteMatched(event)).toBeUndefined();
	});
	it("onRouteMatched, check if onRouteMatched works correctly for undefined route on phone", function() {
		sap.ui.Device.system.phone = true;
		event.getParameter.and.callFake(function(param) {
			switch(param) {
			case "name" : return "name";
			case "arguments" : return null;
			}
		});
		expect(libUnderTest.onRouteMatched(event)).toBeUndefined();
	});
	it("onRouteMatched, check if onRouteMatched work correctly for valueListTable is bound", function() {
		var valueListTable = jasmine.createSpyObj("valueListTable", ["removeItem", "bindAggregation", "attachEventOnce"]);
		view.byId.and.returnValue(valueListTable);
		event.getParameter.and.callFake(function(param) {
			switch(param) {
			case "name" : return "name";
			case "arguments" : return undefined;
			}
		});
		expect(libUnderTest.onRouteMatched(event)).toBeUndefined();
		expect(valueListTable.bindAggregation).not.toHaveBeenCalled();
		expect(valueListTable.attachEventOnce).not.toHaveBeenCalled();
	});
	it("onRouteMatched", function() {
		var valueListTable = jasmine.createSpyObj("valueListTable", ["removeItem", "bindAggregation", "attachEventOnce"]);
		view.byId.and.returnValue(valueListTable);
		sap.ui.Device.system.phone = true;
		event.getParameter.and.callFake(function(param) {
			switch(param) {
			case "name" : return "name";
			case "arguments" : return undefined;
			}
		});
		expect(libUnderTest.onRouteMatched(event)).toBeUndefined();
		expect(valueListTable.bindAggregation).not.toHaveBeenCalled();
		expect(valueListTable.attachEventOnce).not.toHaveBeenCalled();
	});
	it("onRouteMatched", function() {
		event.getParameter.and.callFake(function(param) {
			switch(param) {
			case "name" : return "main";
			case "arguments" : return {"?query" : "query"};
			}
		});
		var valueListTable = jasmine.createSpyObj("valueListTable", ["removeItem", "bindAggregation", "attachEventOnce"]);
		view.byId.and.returnValue(valueListTable);
		expect(libUnderTest.onRouteMatched.call(libUnderTest, event)).toBeUndefined();
		expect(valueListTable.bindAggregation).toHaveBeenCalled();
		expect(valueListTable.attachEventOnce).toHaveBeenCalled();
	});
	it("onRouteMatched", function() {
		sap.ui.Device.system.phone = true;
		event.getParameter.and.callFake(function(param) {
			switch(param) {
			case "name" : return "main";
			case "arguments" : return {"?query" : "query"};
			}
		});
		var valueListTable = jasmine.createSpyObj("valueListTable", ["removeItem", "bindAggregation"]);
		view.byId.and.returnValue(valueListTable);
		expect(libUnderTest.onRouteMatched.call(libUnderTest, event)).toBeUndefined();
		expect(valueListTable.bindAggregation).toHaveBeenCalled();
	});

	it("onRouteMatched", function() {
		event.getParameter.and.callFake(function(param) {
			switch(param) {
			case "name" : return "main";
			case "arguments" : return {"?query" : undefined};
			}
		});
		var valueListTable = jasmine.createSpyObj("valueListTable", ["removeItem", "bindAggregation", "attachEventOnce"]);
		view.byId.and.returnValue(valueListTable);
		expect(libUnderTest.onRouteMatched.call(libUnderTest, event)).toBeUndefined();
		expect(valueListTable.bindAggregation).toHaveBeenCalled();
		expect(valueListTable.attachEventOnce).toHaveBeenCalled();
		
	});
	it("onRouteMatched", function() {
		sap.ui.Device.system.phone = true;
		event.getParameter.and.callFake(function(param) {
			switch(param) {
			case "name" : return "main";
			case "arguments" : return {"?query" : undefined};
			}
		});
		var valueListTable = jasmine.createSpyObj("valueListTable", ["removeItem", "bindAggregation", "attachEventOnce"]);
		view.byId.and.returnValue(valueListTable);
		expect(libUnderTest.onRouteMatched.call(libUnderTest, event)).toBeUndefined();
		expect(valueListTable.bindAggregation).toHaveBeenCalled();
		expect(valueListTable.attachEventOnce).not.toHaveBeenCalled();
		
	});
	it("onRouteMatched", function() {
		event.getParameter.and.callFake(function(param) {
			switch(param) {
			case "name" : return "valuelist";
			case "arguments" : return {"?query" : undefined, ValuelistDetail : "Header(X'test')"};
			}
		});
		var valueListTable = jasmine.createSpyObj("valueListTable", ["removeItem", "bindAggregation", "attachEventOnce", "getItems"]);
		valueListTable.getItems.and.returnValue([]);
		view.byId.and.returnValue(valueListTable);
		expect(libUnderTest.onRouteMatched.call(libUnderTest, event)).toBeUndefined();
		expect(valueListTable.bindAggregation).toHaveBeenCalled();
		expect(valueListTable.attachEventOnce).not.toHaveBeenCalled();
		
	});
	it("onRouteMatched", function() {
		sap.ui.Device.system.phone = true;
		event.getParameter.and.callFake(function(param) {
			switch(param) {
			case "name" : return "valuelist";
			case "arguments" : return {"?query" : undefined, ValuelistDetail : "Header(X'test')"};
			}
		});
		var valueListTable = jasmine.createSpyObj("valueListTable", ["removeItem", "bindAggregation", "attachEventOnce"]);
		view.byId.and.returnValue(valueListTable);
		expect(libUnderTest.onRouteMatched.call(libUnderTest, event)).toBeUndefined();
		expect(valueListTable.bindAggregation).toHaveBeenCalled();
		expect(valueListTable.attachEventOnce).not.toHaveBeenCalled();
		
	});
	it("onRouteMatched", function() {
		event.getParameter.and.callFake(function(param) {
			switch(param) {
			case "name" : return "valuelist";
			case "arguments" : return {"?query" : undefined, ValuelistDetail : "Header(X'test')"};
			}
		});
		var valueListTable = jasmine.createSpyObj("valueListTable", ["removeItem", "bindAggregation", "attachEventOnce", "getItems"]);
		valueListTable.getItems.and.returnValue([]);
		view.byId.and.returnValue(valueListTable);
		expect(libUnderTest.onRouteMatched.call(libUnderTest, event)).toBeUndefined();
		expect(valueListTable.bindAggregation).toHaveBeenCalled();
		expect(valueListTable.attachEventOnce).not.toHaveBeenCalled();
		
	});
	it("onRouteMatched", function() {
		sap.ui.Device.system.phone = true;
		event.getParameter.and.callFake(function(param) {
			switch(param) {
			case "name" : return "valuelist";
			case "arguments" : return {"?query" : undefined, ValuelistDetail : "Header(X'test')"};
			}
		});
		var valueListTable = jasmine.createSpyObj("valueListTable", ["removeItem", "bindAggregation", "attachEventOnce"]);
		view.byId.and.returnValue(valueListTable);
		expect(libUnderTest.onRouteMatched.call(libUnderTest, event)).toBeUndefined();
		expect(valueListTable.bindAggregation).toHaveBeenCalled();
		expect(valueListTable.attachEventOnce).not.toHaveBeenCalled();
		
	});
	it("onRouteMatched", function() {
		event.getParameter.and.callFake(function(param) {
			switch(param) {
			case "name" : return "main";
			case "arguments" : return {"?query" : undefined, ValuelistDetail : undefined};
			}
		});
		var valueListTable = jasmine.createSpyObj("valueListTable", ["removeItem", "bindAggregation", "attachEventOnce"]);
		view.byId.and.returnValue(valueListTable);
		expect(libUnderTest.onRouteMatched.call(libUnderTest, event)).toBeUndefined();
		expect(valueListTable.bindAggregation).toHaveBeenCalled();
		expect(valueListTable.attachEventOnce).toHaveBeenCalled();
		
	});
	it("onRouteMatched", function() {
		event.getParameter.and.callFake(function(param) {
			switch(param) {
			case "name" : return "main";
			case "arguments" : return {"?query" : undefined,  ValuelistDetail : "Header(X'valuelist')"};
			}
		});
		var valueListTable = jasmine.createSpyObj("valueListTable", ["removeItem", "bindAggregation", "attachEventOnce"]);
		view.byId.and.returnValue(valueListTable);
		expect(libUnderTest.onRouteMatched.call(libUnderTest, event)).toBeUndefined();
		expect(valueListTable.bindAggregation).toHaveBeenCalled();
		expect(valueListTable.attachEventOnce).toHaveBeenCalled();
		expect(libUnderTest.selectedValuelist).toEqual("valuelist");
	});
	it("onRouteMatched", function() {
		sap.ui.Device.system.phone = false;
		event.getParameter.and.callFake(function(param) {
			switch(param) {
			case "name" : return "main";
			case "arguments" : return {"?query" : undefined, ValuelistDetail : "Header(X'valuelist')"};
			}
		});
		var valueListTable = jasmine.createSpyObj("valueListTable", ["removeItem", "bindAggregation", "attachEventOnce"]);
		view.byId.and.returnValue(valueListTable);
		expect(libUnderTest.onRouteMatched.call(libUnderTest, event)).toBeUndefined();
		expect(valueListTable.bindAggregation).toHaveBeenCalled();
		expect(valueListTable.attachEventOnce).toHaveBeenCalled();
		expect(libUnderTest.selectedValuelist).toEqual("valuelist");
		expect(libUnderTest.initialLoad).toBeFalsy();
	});
	it("onNew", function() {
		var component = jasmine.createSpyObj("component", ["checkNamespacesExist"]);
		component.checkNamespacesExist.and.returnValue(false);
		spyOn(libUnderTest, "getComponent").and.returnValue(component);
		libUnderTest.onNew.call(libUnderTest);
		expect(router.navTo).not.toHaveBeenCalled();
	});
	it("onNew", function() {
		var component = jasmine.createSpyObj("component", ["checkNamespacesExist"]);
		component.checkNamespacesExist.and.returnValue(true);
		libUnderTest.oRouter = router;
		spyOn(libUnderTest, "getComponent").and.returnValue(component);
		libUnderTest.onNew.call(libUnderTest);
		expect(router.navTo).toHaveBeenCalled();
	});
	it("navigateToDetail", function() {
		
		libUnderTest.oRouter = router;
		
		
		libUnderTest.navigateToDetail("1234", "edit");
		expect(libUnderTest.oRouter.navTo.calls.argsFor(0)[1].query).toEqual("?mode=edit");
		expect(libUnderTest.oRouter.navTo.calls.argsFor(0)[1].ValuelistDetail).toEqual("Header(X'1234')");
	});
	it("navigateToDetail with undefined mode", function() {
		
		libUnderTest.oRouter = router;
		
		
		libUnderTest.navigateToDetail("1234");
		expect(libUnderTest.oRouter.navTo.calls.argsFor(0)[1].query).toEqual("");
		expect(libUnderTest.oRouter.navTo.calls.argsFor(0)[1].ValuelistDetail).toEqual("Header(X'1234')");
	});
	it("onSelect", function() {
		var listItem = jasmine.createSpyObj("listItem", ["getBindingContextPath", "getSelectedItem"]);
		view.byId.and.returnValue(listItem);
		listItem.getSelectedItem.and.returnValue("item");
		event.getSource.and.returnValue(listItem);
		var component = jasmine.createSpyObj("component", ["getNavigationVetoCollector"]);
		var vetoCollector = jasmine.createSpyObj("vetoCollector", ["noVetoExists"]);
		var promise = jasmine.createSpyObj("promise", ["done", "fail"]);
		
		component.getNavigationVetoCollector.and.returnValue(vetoCollector);
		vetoCollector.noVetoExists.and.returnValue(promise);
		promise.done.and.returnValue(promise);
		promise.fail.and.returnValue(promise);
		spyOn(libUnderTest, "getComponent").and.returnValue(component);
		
		libUnderTest.onSelect.call(libUnderTest, event);
		expect(promise.done).toHaveBeenCalled();
		expect(promise.fail).toHaveBeenCalled();
		
		promise.done.calls.argsFor(0)[0]();
		expect(router.navTo).toHaveBeenCalled();
		expect(libUnderTest.lastSelectedItem).toEqual("item");
	});
	it("initialValueSelection", function() {
		var listItem = jasmine.createSpyObj("listItem", ["getBindingContextPath", "getSelectedItem", "getItems"]);
		view.byId.and.returnValue(listItem);
		listItem.getItems.and.returnValue([]);
		libUnderTest.initialValueSelection.call(libUnderTest);
		expect(listItem.getItems).toHaveBeenCalled();
	});
	it("initialValueSelection", function() {
		var listItem = jasmine.createSpyObj("listItem", ["getBindingContextPath", "getSelectedItem", "getItems"]);
		view.byId.and.returnValue(listItem);
		listItem.getItems.and.returnValue([listItem]);
		listItem.getBindingContextPath.and.returnValue("ValueList(X'12345678901234567890123456789012')")
		libUnderTest.initialLoad = true;
		libUnderTest.oRouter = router;
		libUnderTest.initialValueSelection.call(libUnderTest);
		expect(listItem.getItems).toHaveBeenCalled();
		expect(router.navTo).toHaveBeenCalled();
	});
	it("onSearch", function() {
		var searchField = jasmine.createSpyObj("searchField", ["getValue", "getBinding"]);
		var binding = jasmine.createSpyObj("binding", ["filter"]);
		searchField.getBinding.and.returnValue(binding);
		searchField.getValue.and.returnValue("Bla");
		view.byId.and.returnValue(searchField);
		libUnderTest.onSearch.call(libUnderTest);
		expect(binding.filter).toHaveBeenCalled();
		expect()
		
	});
	
});
