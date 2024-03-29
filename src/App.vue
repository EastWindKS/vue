<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <div class="container">
      <add-ticker :is-contain-ticker="isContainTicker" @add-ticker="addTicker" @change-add-ticker-field="onChangeTickerField"/>
      <template v-if="tickers.length">
        <hr class="w-full border-t border-gray-600 my-4"/>
        <div>
          <button
              v-show="page > 1"
              @click="page--"
              class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            Назад
          </button>
          <button
              v-show="hasNextPage"
              @click="page++"
              class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            Вперед
          </button>
          <div> Фильтер: <input v-model="filter" type="text"></div>
        </div>
        <hr class="w-full border-t border-gray-600 my-4"/>
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div
              v-for="(t,index) in paginatedTickers"
              :key="index"
              :class="{
                'bg-red-500 overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer': t.isError,
                'border-4': selectedTicker === t
              }"
              @click="select(t)"
              class="bg-white overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
          >
            <div class="px-4 py-5 sm:p-6 text-center">
              <dt class="text-sm font-medium text-gray-500 truncate">
                {{ t.name }} - USD
              </dt>
              <dd class="mt-1 text-3xl font-semibold text-gray-900">
                {{ formatPrice(t.price) }}
              </dd>
            </div>
            <div class="w-full border-t border-gray-200"></div>
            <button
                @click.stop
                @click="removeTicker(t)"
                class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
            >
              <svg
                  class="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="#718096"
                  aria-hidden="true"
              >
                <path
                    fill-rule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                ></path>
              </svg
              >
              Удалить
            </button>
          </div>
        </dl>
        <hr class="w-full border-t border-gray-600 my-4"/>
      </template>
      <show-graph ref="graph" :ticker-name="selectedTicker?.name" :initialGraph="graph" @close-graph="onCloseGraph"/>
    </div>
  </div>
</template>

<script>
import {subscribeToTicker, unsubscribeFromTicker} from "./api";
import AddTicker from "@/components/AddTicker";
import ShowGraph from "@/components/ShowGraph";

export default {
  name: "App",
  components: {ShowGraph, AddTicker},
  data() {
    return {
      BTCUSD: 0,
      filter: "",
      page: 1,
      isContainTicker: false,
      tickers: [],
      selectedTicker: null,
      graph: [],
      maxGraphElements: 1,
    };
  },
  methods: {
    async addTicker(tickerName) {
      const currentTicker = {
        name: tickerName.toUpperCase(),
        price: "-",
        isError: false
      };

      this.isContainsTicker(currentTicker.name);
      if (this.isContainTicker) {
        return;
      }

      this.tickers = [...this.tickers, currentTicker];
      subscribeToTicker(currentTicker.name, "USD",
          (newPrice, currency) => this.updateTicker(currentTicker.name, newPrice, currency), () => this.onError(currentTicker.name));

    },

    onChangeTickerField() {
      this.isContainTicker = false;
    },

    removeTicker(ticker) {
      this.tickers = this.tickers.filter(t => t !== ticker);
      unsubscribeFromTicker(ticker.name, "USD");

      if (ticker === this.selectedTicker) {
        this.selectedTicker = null;
      }
    },

    select(ticker) {
      this.selectedTicker = ticker;
    },

    formatPrice(price) {
      if (price === '-') {
        return price;
      }

      return price > 1 ? price.toFixed(2) : price.toPrecision(2);
    },

    updateTicker(tickerName, price, crossCurrency) {

      if (tickerName === "BTCUSD") {
        this.BTCUSD = price;
      }

      this.tickers.filter(t => t.name === tickerName).forEach(t => {
        if (crossCurrency === "BTC") {
          t.price = price * this.BTCUSD
          t.prevPrice = price;
        } else {
          t.price = price;
        }

        t.crossCurrency = crossCurrency;
        if (t === this.selectedTicker) {
          this.graph.push(t.price);
          if (this.graph.length > this.maxGraphElements) {
            this.graph = this.graph.slice(this.graph.length - this.maxGraphElements)
          }
        }
      });
    },

    onError(tickerName) {
      this.tickers.filter(t => t.name === tickerName).forEach(t => {
        t.isError = true;
      });
    },

    calculateMaxGraphElements() {
      if (!this.$refs.graph) {
        return;
      }

      this.maxGraphElements = this.$refs.graph.clientWidth / 38;
    },

    isContainsTicker(tickerName) {
      this.isContainTicker = this.tickers.some(t => t.name === tickerName);
    },

    onCloseGraph() {
      this.selectedTicker = null;
    },
  },

  computed: {
    startIndex() {
      return (this.page - 1) * 6;
    },

    endIndex() {
      return this.page * 6;
    },

    filteredTickers() {
      return this.tickers.filter(ticker => ticker.name.includes(this.filter));
    },

    paginatedTickers() {
      return this.filteredTickers.slice(this.startIndex, this.endIndex);
    },

    hasNextPage() {
      return this.filteredTickers.length > this.endIndex;
    },

    pageStateOptions() {
      return {
        filter: this.filter,
        page: this.page
      }
    },
  },

  watch: {
    tickers() {
      localStorage.setItem("tickers", JSON.stringify(this.tickers));
    },

    BTCUSD() {
      this.tickers.forEach(t => {
        if (t.crossCurrency && t.prevPrice) {
          t.price = t.prevPrice * this.BTCUSD;
        }
      })
    },

    pageStateOptions(value) {
      history.pushState(null, document.title, `${window.location.pathname}?filter=${value.filter}&page${value.page}`);
    },

    selectedTicker() {
      this.graph = [];
      this.$nextTick().then(this.calculateMaxGraphElements);
    },

    filter() {
      this.page = 1;
    },

    page() {
      history.pushState(null, document.title, `${window.location.pathname}?filter=${this.filter}&page${this.page}`);
    },

    paginatedTickers() {
      if (this.paginatedTickers.length === 0 && this.page > 1) {
        this.page--;
      }
    }
  },

  created() {
    const windowData = Object.fromEntries(new URL(window.location).searchParams.entries());
    const validKeys = ["filter", "page"];

    validKeys.forEach(key => {
      if (windowData[key]) {
        this[key] = windowData[key];
      }
    })

    const tickersInLocalStorage = localStorage.getItem("tickers");

    if (tickersInLocalStorage) {
      this.tickers = JSON.parse(tickersInLocalStorage);
      this.tickers.forEach(t => {
        subscribeToTicker(t.name, "USD", (newPrice, currency) => this.updateTicker(t.name, newPrice, currency), () => this.onError(t.name));
      })
    }

    subscribeToTicker("BTC", "USD", (newPrice, currency) => this.updateTicker("BTCUSD", newPrice, currency));
    setInterval(this.updateTicker, 6000);
  },

  mounted() {
    this.calculateMaxGraphElements();
    window.addEventListener("resize", this.calculateMaxGraphElements);
  },

  beforeUnmount() {
    window.removeEventListener("resize", this.calculateMaxGraphElements);
  },
};
</script>
