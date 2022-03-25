<template>
  <custom-loader :is-loading="isLoading"/>
  <section>
    <div class="flex">
      <div class="max-w-xs">
        <label for="wallet" class="block text-sm font-medium text-gray-700">Тикер</label>
        <div class="mt-1 relative rounded-md shadow-md">
          <input
              @keydown.enter="addTicker"
              v-model="ticker"
              @input="onChange"
              type="text"
              name="wallet"
              id="wallet"
              class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
              placeholder="Например DOGE"
          />
        </div>
        <div class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap" v-show="availableCoins.length > 0">
            <span
                v-for="coin in availableCoins"
                :key="coin.Id"
                @click="onHelpClick(coin)"
                class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer">
              {{ coin.Symbol }}
            </span>
        </div>
        <div v-show="isContainTicker" class="text-sm text-red-600">Такой тикер уже добавлен</div>
      </div>
    </div>
    <add-button @add-click="addTicker"/>
  </section>
</template>

<script>
import AddButton from "@/components/AddButton";
import {getCoinsList} from "@/api";
import CustomLoader from "@/components/CustomLoader";

export default {
  name: "AddTicker",
  components: {CustomLoader, AddButton},
  props: {
    isContainTicker: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  emits: {
    "add-ticker": value => typeof value === "string" && value.length > 0,
    "change-add-ticker-field": null
  },

  data() {
    return {
      isLoading: true,
      ticker: "",
      availableCoins: [],
      coinsList: []
    }
  },

  methods: {
    addTicker() {
      if (this.ticker.length === 0) {
        return;
      }

      this.$emit("add-ticker", this.ticker);
      this.$nextTick().then(() => {
        if (!this.$props.isContainTicker) {
          this.ticker = "";
          this.availableCoins = [];
        }
      });
    },

    onHelpClick(coin) {
      this.ticker = coin.Symbol;
      this.props.isContainTicker = false;
      this.addTicker();
    },

    onChange() {
      this.availableCoins = [];
      this.$emit("change-add-ticker-field")
      this.coinsList.forEach(f => {
        if (this.availableCoins.length < 4 && this.ticker.length > 0 && f.Symbol.includes(this.ticker.toUpperCase())) {
          this.availableCoins.push(f);
        }
      });
    },

    async fetchCoinsList() {
      this.coinsList = await getCoinsList().then(r => {
        const coins = Object.values(r.Data);
        this.isLoading = false;
        return coins;
      });
    }
  },

  created() {
    this.fetchCoinsList();
  },
}
</script>
