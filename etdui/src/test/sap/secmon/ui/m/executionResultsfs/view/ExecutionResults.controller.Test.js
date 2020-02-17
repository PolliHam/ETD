describe(
		"ExecutionResults.controller Tests",
		function() {
			// jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
			jQuery.sap
					.require({
						modName : "sap.secmon.ui.m.executionResultsfs.view.ExecutionResults",
						type : "controller"
					});
			 jQuery.sap.require("test.TestHelper");
			var libUnderTest;
			var view, dialog, parentView, errorHandler, bindingContext, router, uicomponent, event, namespaceSelect, component, model, control, resourceBundle;
			afterEach(function() {
			});
			beforeEach(function() {
				libUnderTest = sap.ui
						.controller("sap.secmon.ui.m.executionResultsfs.view.ExecutionResults");
				view = test.TestHelper.createMockView();
				control = jasmine.createSpyObj("control", [ "setValueState",
						"getSelected", "setValue", "setText", "setVisible",
						"getVisible", "getModel","getBinding", "getBindingInfo", "setVizProperties", "getVizUid", "connect" ]);
				dialog = jasmine.createSpyObj("dialog", [ "setModel", "open",
						"close", "focus", "getModel", "getParent", "getSelectedFilterItems", "getFilterItems", "getSortItems" ]);
				parentView = test.TestHelper.createMockView();
				bindingContext = test.TestHelper.createMockBindingContext();
				spyOn(libUnderTest, "getView").and.returnValue(view);
				dialog.getParent.and.returnValue(view);
				event = test.TestHelper.createMockEvent();
				namespaceSelect = jasmine.createSpyObj("namespaceSelect", [
						"removeItem", "bindAggregation", "getSelectedItem" ]);
				router = test.TestHelper.createMockRouter();
				component = test.TestHelper.createMockComponent();
				resourceBundle = test.TestHelper.createMockResourceBundle();
				spyOn(libUnderTest, "getComponent").and.returnValue(component);

				model = test.TestHelper.createMockModel();
				model.getResourceBundle.and.returnValue(resourceBundle);
				component.getModel.and.returnValue(model);
				spyOn(sap.ui.core.UIComponent, "getRouterFor").and.returnValue(router);
				sap.ui.Device.system.phone = false;
				spyOn(sap.ui, "xmlfragment").and.returnValue(dialog);

			});
		
			it("onInit", function() {
			    
			    view.byId.and.returnValue(control);
				libUnderTest.onInit.call(libUnderTest);
				expect(libUnderTest.oCommons).not.toBeUndefined();
			
			});
//			xit("onRouteMatched route to main", function() {
//				view.byId.and.returnValue(control);
//				var event = jasmine.createSpyObj("event", [ "getParameter" ]);
//				spyOn(sap.secmon.ui.commons.FilterSortUtil, "applyFiltersAndSorterToTable");
//				event.getParameter.and.returnValue("main");
//
//				expect(libUnderTest.onRouteMatched.call(libUnderTest, event))
//						.toBeUndefined();
//				expect(libUnderTest.getRouteName()).toEqual("main");
//				expect(router.navTo).toHaveBeenCalled();
//
//			});
//			it("onRouteMatched not matching route", function() {
//				view.byId.and.returnValue(control);
//				var event = jasmine.createSpyObj("event", [ "getParameter" ]);
//				event.getParameter.and.returnValue("bla");
//
//				expect(libUnderTest.onRouteMatched.call(libUnderTest, event))
//						.toBeUndefined();
//				expect(libUnderTest.getRouteName()).toEqual("bla");
//				expect(router.navTo).not.toHaveBeenCalled();
//
//			});
						
});