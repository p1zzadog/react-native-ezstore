import _ from 'lodash'

//
// Stores is a repository for holding on to a collection of Store objects, by name.
//
export const Stores = {
    stores: {},

    addStore: function (name, store) {
        this.stores[name] = store;
    },

    removeStore: function(name) {
        delete this.stores[name];
        return;
    },

    getStore: function (name) {
        return this.stores[name];
    }
};

export const Mutator = class Mutator {
    constructor(target, onMutated) {
        this.target = target;
        if (!this.target.setState) {
            throw {message: "Target does not contain a setState function."}
        }
        this.onMutated = onMutated;
    }

    mutate(key, mutationFunc) {
        return function(eventOrValue) {
            var value = null;

            if (eventOrValue) {
                if (eventOrValue.target && eventOrValue.target.type == 'checkbox') {
                    value = eventOrValue.target.checked
                }
                else {
                    value = eventOrValue.target ? eventOrValue.target.value : eventOrValue;
                }
            }

            var newState = {...this.target.state};
            _.set(newState, key, value);

            this.target.setState(newState);
            if (mutationFunc) mutationFunc(this.target, key, value);
            if (this.onMutated) this.onMutated(this.target, key, value);
        }.bind(this);
    }
}

export const FunctionalMutator = class FunctionalMutator {
    constructor(target, onMutated) {
        this.target = target;
        this.onMutated = onMutated;
    }

    mutate(key, mutationFunc) {
        return function(eventOrValue) {
            var value = eventOrValue.target ? eventOrValue.target.value : eventOrValue;
            if (mutationFunc) mutationFunc(this.target, key, value);
            if (this.onMutated) this.onMutated(this.target, key, value);
        }.bind(this);
    }
}


//
// Store is a state-based object with listeners that are fired on state changes.
//
export const Store = class Store {
    constructor(state) {
        this.state     = state || {};
        this.state.get = (key, def) => {
            return _.get(this.state, key, def)
        }
        this.listeners = [];
        this.mutator = new Mutator(this);
    }

    getMutator() {
        return this.mutator;
    }

    setState(newState) {
        //console.log("State Before: ", this.state);
        var newState = {...this.state, ...newState};
        this.state   = newState;
        //console.log("State After: ", this.state);

        this.listeners.forEach(listener => {
            if (_.isFunction(listener)) { listener(this.state) }
    });
    }

    getState() {
        return this.state;
    }

    subscribe(listener) {
        if (!_.isFunction(listener)) {
            console.log("Listener must be a function");
            throw {message: "Listener must be a function."}
        }
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        }
    }
}