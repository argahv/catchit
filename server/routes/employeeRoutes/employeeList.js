const mongoose = require("mongoose");
const authenticateToken = require("../../middlewares/authenticateToken");
const isSuperAdmin = require("../../middlewares/isSuperAdmin");
const allowCors = require("../../middlewares/allowCors");

const Employees = mongoose.model("users");

module.exports = (app) => {
  app.get(
    `/api/v1/employees-list`,
    allowCors,
    authenticateToken,
    isSuperAdmin,
    async (req, res) => {
      const {
        page,
        limit,
        search = {
          searchField: [] || "",
          searchValue: [] || "",
        },
        sort = {},
      } = req.query;
      console.log("req.query", req.query);
      const myCustomLabels = {
        totalDocs: "total",
        docs: "employees",
        limit: "limit",
        page: "page",
        nextPage: "next",
        prevPage: "prev",
        totalPages: "pageCount",
        pagingCounter: "slNo",
        meta: "paginator",
      };
      const options = {
        page,
        limit,
        sort,
        customLabels: myCustomLabels,
      };
      let queryObj = {};
      const { searchField, searchValue } = search;
      if (req.query.search && Array.isArray(req.query.search.searchField)) {
        queryObj.$or = searchField.map((searchData, index) => ({
          [searchData]: searchValue[index],
        }));
      } else if (req.query.search && typeof searchField === "string") {
        queryObj[searchField] = searchValue;
      }

      try {
        await Employees.paginate(queryObj, options, async (err, result) => {
          const empList = result.employees.map(
            ({ full_name, rank, _id, date_joined, email, role }) => ({
              full_name,
              rank,
              role,
              email,
              date_joined,
              _id,
            })
          );
          res
            .status(200)
            .send({ data: { empList, paginator: result.paginator } });
        });
      } catch (error) {
        res.status(500).send({ message: "Something went wrong", error });
      }
    }
  );
};
