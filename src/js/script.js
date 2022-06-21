/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
	;('use strict')

	const select = {
		templateOf: {
			menuProduct: '#template-menu-product',
			cartProduct: '#template-cart-product', // CODE ADDED
		},
		containerOf: {
			menu: '#product-list',
			cart: '#cart',
		},
		all: {
			menuProducts: '#product-list > .product',
			menuProductsActive: '#product-list > .product.active',
			formInputs: 'input, select',
		},
		menuProduct: {
			clickable: '.product__header',
			form: '.product__order',
			priceElem: '.product__total-price .price',
			imageWrapper: '.product__images',
			amountWidget: '.widget-amount',
			cartButton: '[href="#add-to-cart"]',
		},
		widgets: {
			amount: {
				input: 'input.amount', // CODE CHANGED
				linkDecrease: 'a[href="#less"]',
				linkIncrease: 'a[href="#more"]',
			},
		},
		// CODE ADDED START
		cart: {
			productList: '.cart__order-summary',
			toggleTrigger: '.cart__summary',
			totalNumber: `.cart__total-number`,
			totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
			subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
			deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
			form: '.cart__order',
			formSubmit: '.cart__order [type="submit"]',
			phone: '[name="phone"]',
			address: '[name="address"]',
		},
		cartProduct: {
			amountWidget: '.widget-amount',
			price: '.cart__product-price',
			edit: '[href="#edit"]',
			remove: '[href="#remove"]',
		},
		// CODE ADDED END
	}

	const classNames = {
		menuProduct: {
			wrapperActive: 'active',
			imageVisible: 'active',
		},
		// CODE ADDED START
		cart: {
			wrapperActive: 'active',
		},
		// CODE ADDED END
	}

	const settings = {
		amountWidget: {
			defaultValue: 1,
			defaultMin: 1,
			defaultMax: 9,
		}, // CODE CHANGED
		// CODE ADDED START
		cart: {
			defaultDeliveryFee: 20,
		},
		// CODE ADDED END
	}

	const templates = {
		menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
		// CODE ADDED START
		cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
		// CODE ADDED END
	}

	class Product {
		constructor(id, data) {
			const thisProduct = this

			thisProduct.id = id
			thisProduct.data = data

			thisProduct.renderInMenu()
			thisProduct.getElements()
			thisProduct.initAccordion()
			thisProduct.initOrderForm()
			thisProduct.initAmountWidget()
			thisProduct.processOrder()
		}

		renderInMenu() {
			const thisProduct = this

			/* Generate HTML basen on template */
			const generatedHTML = templates.menuProduct(thisProduct.data)
			/* Create element using utils.createElementFromHTML */
			thisProduct.element = utils.createDOMFromHTML(generatedHTML)
			/* find menu container */
			const menuContainer = document.querySelector(select.containerOf.menu)
			/* add elemtn to menu */
			menuContainer.appendChild(thisProduct.element)
		}

		getElements() {
			const thisProduct = this

			thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable)
			thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form)
			thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs)
			thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton)
			thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem)
			thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper)
			thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget)
		}

		initAccordion() {
			const thisProduct = this

			/* START: add event listeer to clickable trigger on event click */
			thisProduct.accordionTrigger.addEventListener('click', function (event) {
				/* prevent default action for event */
				event.preventDefault()
				/* find active product (product that has active class) */
				const activeProduct = document.querySelector(select.all.menuProductsActive)
				/* if there is active product and it's not thisProduct.element, remove class active from it */
				if (activeProduct != null && activeProduct != thisProduct.element) {
					activeProduct.classList.remove(classNames.menuProduct.wrapperActive)
				}
				/* toggle active class on thisProduct.element */
				thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive)
			})
		}

		initOrderForm() {
			const thisProduct = this

			thisProduct.form.addEventListener('submit', function (event) {
				event.preventDefault()
				thisProduct.processOrder()
			})

			for (let input of thisProduct.formInputs) {
				input.addEventListener('change', function () {
					thisProduct.processOrder()
				})
			}

			thisProduct.cartButton.addEventListener('click', function (event) {
				event.preventDefault()
				thisProduct.processOrder()
				thisProduct.addToCart()
			})
		}

		initAmountWidget() {
			const thisProduct = this

			thisProduct.amountWidgetElem.addEventListener('updated', function () {
				thisProduct.processOrder()
			})
			thisProduct.amountWidget = new amountWidget(thisProduct.amountWidgetElem)
		}

		processOrder() {
			const thisProduct = this

			const formData = utils.serializeFormToObject(thisProduct.form)

			// set price to default price
			let price = thisProduct.data.price

			// for every catergory (param)...
			for (let paramId in thisProduct.data.params) {
				//determine param value e.g. paramId = 'toppings', param = { label: 'Toppings", type: 'checkboxes'...}
				const param = thisProduct.data.params[paramId]

				//for every option in this category
				for (let optionId in param.options) {
					// determine option value, e.g. optionId = 'olives' option = { label: 'Olives', price: 2, default: true }
					const option = param.options[optionId]
					// check if there is param with a name of paramId in formData and if it includes optionId
					if (formData[paramId] && formData[paramId].includes(optionId)) {
						// check if the option is not default
						if (!option.default) {
							// add option price to price variable
							price += option.price
						}
					} else {
						// check if the option is default
						if (option.default == true) {
							// reduce price variable
							price -= option.price
						}
					}
					const optionImage = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId)

					if (optionImage) {
						if (formData[paramId] && formData[paramId].includes(optionId)) {
							optionImage.classList.add(classNames.menuProduct.imageVisible)
						} else {
							optionImage.classList.remove(classNames.menuProduct.imageVisible)
						}
					}
				}
			}

			//update calculated price in the HTML
			thisProduct.priceSingle = price
			price *= thisProduct.amountWidget.value
			thisProduct.priceElem.innerHTML = price
		}

		addToCart() {
			const thisProduct = this

			app.cart.add(thisProduct.prepareCartProduct())
		}

		prepareCartProduct() {
			const thisProduct = this

			const productSummary = {
				id: thisProduct.id,
				name: thisProduct.data.name,
				amount: thisProduct.amountWidget.value,
				priceSingle: thisProduct.priceSingle,
				price: thisProduct.priceSingle * thisProduct.amountWidget.value,
				params: thisProduct.prepareCartProductParams(),
			}
			return productSummary
		}

		prepareCartProductParams() {
			const thisProduct = this

			const formData = utils.serializeFormToObject(thisProduct.form)
			const params = {}

			// for very category (param)
			for (let paramId in thisProduct.data.params) {
				const param = thisProduct.data.params[paramId]

				// create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}}
				params[paramId] = {
					label: param.label,
					options: {},
				}

				// for every option in this category
				for (let optionId in param.options) {
					const option = param.options[optionId]
					const optionSelected = formData[paramId] && formData[paramId].includes(optionId)

					if (optionSelected) {
						params[paramId].options[optionId] = option.label
					}
				}
			}

			return params
		}
	}

	class amountWidget {
		constructor(element) {
			const thisWidget = this

			thisWidget.getElements(element)
			thisWidget.setValue(settings.amountWidget.defaultValue)
			thisWidget.initActions()
		}
		getElements(element) {
			const thisWidget = this

			thisWidget.element = element
			thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input)
			thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease)
			thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease)
		}

		announce() {
			const thisWidget = this

			const event = new CustomEvent('updated', {
				bubbles: true,
			})
			thisWidget.element.dispatchEvent(event)
		}

		setValue(value) {
			const thisWidget = this
			const newValue = parseInt(value)
			const maxValue = settings.amountWidget.defaultMax
			const minValue = settings.amountWidget.defaultMin

			if (thisWidget.value !== newValue && !isNaN(newValue) && newValue >= minValue && newValue <= maxValue) {
				thisWidget.value = newValue
			}

			thisWidget.input.value = thisWidget.value
			thisWidget.announce()
		}

		initActions() {
			const thisWidget = this
			thisWidget.input.addEventListener('change', function () {
				thisWidget.setValue(thisWidget.input.value)
			})

			thisWidget.linkDecrease.addEventListener('click', function (event) {
				event.preventDefault()
				thisWidget.setValue(thisWidget.value - 1)
			})

			thisWidget.linkIncrease.addEventListener('click', function (event) {
				event.preventDefault()
				thisWidget.setValue(thisWidget.value + 1)
			})
		}
	}

	class Cart {
		constructor(element) {
			const thisCart = this

			thisCart.products = []

			thisCart.getElements(element)
			thisCart.initActions()
		}

		getElements(element) {
			const thisCart = this;

			thisCart.dom = {
				toggleTrigger: element.querySelector(select.cart.toggleTrigger),
				productList: element.querySelector(select.cart.productList),
				deliveryFee: element.querySelector(select.cart.deliveryFee),
				subtotalPrice: element.querySelector(select.cart.subtotalPrice),
				totalPrice: element.querySelector(select.cart.totalPrice),
				secTotalPrice: element.querySelectorAll(select.cart.totalPrice)[1],
				totalNumber: element.querySelector(select.cart.totalNumber),
			}
			thisCart.dom.wrapper = element
		}

		initActions() {
			const thisCart = this

			thisCart.dom.toggleTrigger.addEventListener('click', function () {
				thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive)
			})
			thisCart.dom.productList.addEventListener('updated', function () {
				thisCart.update()
			})
			thisCart.dom.productList.addEventListener('remove', function (event) {
				thisCart.remove(event.detail.cartProduct)
			})
		}

		add(menuProduct) {
			const thisCart = this

			/* Generate HTML basen on template */
			const generatedHTML = templates.cartProduct(menuProduct)
			/* Create element using utils.createElementFromHTML */
			const generatedDOM = utils.createDOMFromHTML(generatedHTML)
			/* add elemtn to menu */
			thisCart.dom.productList.appendChild(generatedDOM)

			thisCart.products.push(new CartProduct(menuProduct, generatedDOM))

			thisCart.update()
		}

		update() {
			const thisCart = this

			thisCart.deliveryFee = settings.cart.defaultDeliveryFee

			thisCart.totalNumber = 0
			thisCart.subtotalPrice = 0

			for (let product of thisCart.products) {
				thisCart.totalNumber += product.amountWidget.value
				thisCart.subtotalPrice += product.price
			}

			if (thisCart.totalNumber <= 0) {
				thisCart.deliveryFee = 0
			}

			thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee

			thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee
			thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice
			thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber
			thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice
			thisCart.dom.secTotalPrice.innerHTML = thisCart.totalPrice
		}


	}
	class CartProduct {
		constructor(menuProduct, element) {
			const thisCartProduct = this
			thisCartProduct.id = menuProduct.id
			thisCartProduct.amount = menuProduct.amount
			thisCartProduct.name = menuProduct.name
			thisCartProduct.params = menuProduct.params
			thisCartProduct.price = menuProduct.price
			thisCartProduct.priceSingle = menuProduct.priceSingle

			thisCartProduct.getElements(element)
			thisCartProduct.initAmountWidget()
			thisCartProduct.initActions()
		}

		getElements(element) {
			const thisCartProduct = this

			thisCartProduct.dom = {
				amountWidget: element.querySelector(select.cartProduct.amountWidget),
				price: element.querySelector(select.cartProduct.price),
				edit: element.querySelector(select.cartProduct.edit),
				remove: element.querySelector(select.cartProduct.remove),
			}
			thisCartProduct.dom.wrapper = element
		}

		initAmountWidget() {
			const thisCartProduct = this
			thisCartProduct.amountWidget = new amountWidget(thisCartProduct.dom.amountWidget)

			thisCartProduct.dom.amountWidget.addEventListener('updated', function () {
				thisCartProduct.amount = thisCartProduct.amountWidget.value

				thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount

				thisCartProduct.dom.price.innerHTML = thisCartProduct.price
			})
		}

		remove() {
			const thisCartProduct = this

			const event = new CustomEvent('remove', {
				bubbles: true,
				detail: {
					cartProduct: thisCartProduct,
				},
			})

			thisCartProduct.dom.wrapper.dispatchEvent(event)
		}
		initActions() {
			const thisCartProduct = this

			thisCartProduct.dom.edit.addEventListener('click', function (event) {
				event.preventDefault()
			})

			thisCartProduct.dom.remove.addEventListener('click', function (event) {
				event.preventDefault()
				thisCartProduct.remove()
			})
		}
	}

	const app = {
		initMenu: function () {
			const thisApp = this

			for (let productData in thisApp.data.products) {
				new Product(productData, thisApp.data.products[productData])
			}
		},

		initData: function () {
			const thisApp = this

			thisApp.data = dataSource
		},

		initCart: function () {
			const thisApp = this

			const cartElem = document.querySelector(select.containerOf.cart)
			thisApp.cart = new Cart(cartElem)
		},

		init: function () {
			const thisApp = this

			thisApp.initData()
			thisApp.initMenu()
			thisApp.initCart()
		},
	}

	app.init()
}
