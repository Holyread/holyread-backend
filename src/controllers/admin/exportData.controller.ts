import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';
import excel from 'exceljs';
import usersService from '../../services/admin/users/user.service'
import bookSummaryService from '../../services/admin/book/bookSummary.service'
import transactionsService from '../../services/admin/users/transactions.service'

import { setColumnWidth, setHeaderBackgroundColor } from '../../lib/utils/utils';
import readsOfDayService from '../../services/admin/readsOfDay/readsOfDay.service';
import smallGroupService from '../../services/admin/smallGroup/smallGroup.service';
import expertCuratedService from '../../services/admin/book/expertCurated.service';
import fs from 'fs';

const exportData = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { selectedDataTypes } = request.body;
        const fileName = `export_data_${Date.now()}.xlsx`;
        let data = [];
        const workbook = new excel.Workbook();

        // Fetch data based on selected data types
        for (const dataType of selectedDataTypes) {
            switch (dataType) {
                case 'Daily devotional':
                    // Fetch reads of day data
                    const readsOfDayList = await readsOfDayService.getReadsOfDayList();
                    data.push({ dataType, data: readsOfDayList });
                    break;
                case 'Curated list':
                    // Fetch curated list data
                    const curatedList = await expertCuratedService.getExpertCuratedList();
                    data.push({ dataType, data: curatedList });
                    break;
                case 'Books':
                    // Fetch book list data
                    const bookData = await bookSummaryService.getAllBookSummaries(0, 0, {}, '');
                    const books = bookData.summaries
                    data.push({ dataType, data: books });
                    break;
                case 'Users':
                    // Fetch users data (if available)
                    const userData = await usersService.getAllUsers(0, 0, {}, { createdAt: -1 });
                    const userList = userData.users
                    data.push({ dataType, data: userList });
                    // Implement the logic to fetch users data
                    break;
                case 'Transactions':
                    // Fetch transactions data
                    const transactionList = await transactionsService.getTransactionsList();
                    data.push({ dataType, data: transactionList });
                    break;
                case 'Small group':
                    // Fetch small group data
                    const smallGroupList = await smallGroupService.getSmallGroupsList();
                    data.push({ dataType, data: smallGroupList });
                    break;
                case 'Most popular':
                    // Fetch most popular data
                    const bookList = await bookSummaryService.getAllBookSummaries(0, 0, { popular: true }, '');
                    const mostPopularList = bookList.summaries
                    data.push({ dataType, data: mostPopularList });
                    break;
                default:
                    break;
            }
        }

        // Generate Excel file
        const wsForDailyDevotional = workbook.addWorksheet('Daily devotional');
        const wsCuratedList = workbook.addWorksheet('Curated List')
        const wsSmallGroup = workbook.addWorksheet('Small group')
        const wsMostPopularBooks = workbook.addWorksheet('Most popular Books')
        const wsBooks = workbook.addWorksheet('Books')
        const wsTransactions = workbook.addWorksheet('Transactions')
        const wsUsers = workbook.addWorksheet('Users')

        /* set header */
        const dailyDevotionalExcelHeader = [
            { header: 'Title', key: 'title' },
            { header: 'SubTitle', key: 'subTitle' },
            { header: 'Content Type', key: 'contentType' },
            { header: 'Video', key: 'video' },
            { header: 'Image', key: 'image' },
            { header: 'Status', key: 'status' },
            { header: 'Created At', key: 'createdAt' },
            { header: 'Display At', key: 'displayAt' },
        ];


        /* set header */
        const curatedExcelHeader = [
            { header: 'Title', key: 'title' },
            { header: 'Description', key: 'description' },
            { header: 'shortDescription', key: 'shortDescription' },
            { header: 'Views', key: 'views' },
            { header: 'Publish', key: 'publish' },
            { header: 'Image', key: 'image' },
            { header: 'Status', key: 'status' },
            { header: 'Created At', key: 'createdAt' },
            { header: 'Updated At', key: 'updatedAt' },
        ];

        /* set header */
        const smallGroupExcelHeader = [
            { header: 'Title', key: 'title' },
            { header: 'Description', key: 'description' },
            { header: 'Conclusion', key: 'conclusion' },
            { header: 'Introduction', key: 'introduction' },
            { header: 'Publish', key: 'publish' },
            { header: 'Image', key: 'coverImage' },
            { header: 'Status', key: 'status' },
            { header: 'IceBreaker', key: 'iceBreaker' },
            { header: 'Created At', key: 'createdAt' },
            { header: 'Updated At', key: 'updatedAt' },
        ];

        /* set header */
        const mostPopularBooksExcelHeader = [
            { header: 'Title', key: 'title' },
            { header: 'Description', key: 'description' },
            { header: 'Conclusion', key: 'overview' },
            { header: 'CoverImageBackground', key: 'coverImageBackground' },
            { header: 'Publish', key: 'publish' },
            { header: 'Image', key: 'coverImage' },
            { header: 'Status', key: 'status' },
            { header: 'BookReadFile', key: 'bookReadFile' },
            { header: 'Views', key: 'views' },
            { header: 'VideoFileSize', key: 'videoFileSize' },
            { header: 'BookFor', key: 'bookFor' },
            { header: 'Created At', key: 'createdAt' },
            { header: 'Updated At', key: 'updatedAt' },
        ];

        const booksExcelHeader = [
            { header: 'Title', key: 'title' },
            { header: 'Description', key: 'description' },
            { header: 'Conclusion', key: 'overview' },
            { header: 'CoverImageBackground', key: 'coverImageBackground' },
            { header: 'Publish', key: 'publish' },
            { header: 'Image', key: 'coverImage' },
            { header: 'Status', key: 'status' },
            { header: 'BookReadFile', key: 'bookReadFile' },
            { header: 'Views', key: 'views' },
            { header: 'VideoFileSize', key: 'videoFileSize' },
            { header: 'BookFor', key: 'bookFor' },
            { header: 'Created At', key: 'createdAt' },
            { header: 'Updated At', key: 'updatedAt' },
        ];

        const transactionsExcelHeader = [
            { header: 'UserId', key: 'userId' },
            { header: 'PaymentLink', key: 'paymentLink' },
            { header: 'Reason', key: 'reason' },
            { header: 'LatestInvoice', key: 'latestInvoice' },
            { header: 'Status', key: 'status' },
            { header: 'PaymentMethod', key: 'paymentMethod' },
            { header: 'Tax', key: 'tax' },
            { header: 'Total', key: 'total' },
            { header: 'Device', key: 'device' },
            { header: 'PlanCreatedAt', key: 'planCreatedAt' },
            { header: 'PlanExpiredAt', key: 'planExpiredAt' },
        ];

        const usersExcelHeader = [
            { header: 'FirstName', key: 'firstName' },
            { header: 'LastName', key: 'lastName' },
            { header: 'Email', key: 'email' },
            { header: 'Status', key: 'status' },
            { header: 'Image', key: 'image' },
            { header: 'Type', key: 'type' },
            { header: 'IsSignedUp', key: 'isSignedUp' },
            { header: 'Device', key: 'device' },
            { header: 'CreatedAt', key: 'createdAt' },
        ];
        wsForDailyDevotional.columns = dailyDevotionalExcelHeader;
        wsCuratedList.columns = curatedExcelHeader;
        wsSmallGroup.columns = smallGroupExcelHeader;
        wsMostPopularBooks.columns = mostPopularBooksExcelHeader
        wsBooks.columns = booksExcelHeader
        wsTransactions.columns = transactionsExcelHeader
        wsUsers.columns = usersExcelHeader

        // Add data to worksheet
        data.forEach(({ dataType, data }) => {
            data.forEach(item => {
                if (dataType === 'Daily devotional') {
                    wsForDailyDevotional.addRow([
                        item.title,
                        item.subTitle,
                        item.contentType,
                        item.video,
                        item.image,
                        item.status,
                        item.createdAt,
                        item.displayAt // Add displayAt column
                    ]);
                }
                else if (dataType === 'Curated list') {
                    wsCuratedList.addRow([
                        item.title,
                        item.description,
                        item.shortDescription,
                        item.views,
                        item.publish,
                        item.image,
                        item.status,
                        item.createdAt,
                        item.updatedAt // Add displayAt column
                    ]);
                }
                else if (dataType === 'Small group') {
                    wsSmallGroup.addRow([
                        item.title,
                        item.description,
                        item.conclusion,
                        item.introduction,
                        item.publish,
                        item.coverImage,
                        item.status,
                        item.iceBreaker,
                        item.createdAt,
                        item.updatedAt // Add displayAt column
                    ]);
                }
                else if (dataType === 'Most popular') {
                    wsMostPopularBooks.addRow([
                        item.title,
                        item.description,
                        item.overview,
                        item.coverImageBackground,
                        item.publish,
                        item.coverImage,
                        item.status,
                        item.bookReadFile,
                        item.views,
                        item.videoFileSize,
                        item.bookFor,
                        item.createdAt,
                        item.updatedAt,
                    ]);
                }
                else if (dataType === 'Books') {
                    wsBooks.addRow([
                        item.title,
                        item.description,
                        item.overview,
                        item.coverImageBackground,
                        item.publish,
                        item.coverImage,
                        item.status,
                        item.bookReadFile,
                        item.views,
                        item.videoFileSize,
                        item.bookFor,
                        item.createdAt,
                        item.updatedAt,
                    ]);
                }
                else if (dataType === 'Transactions') {
                    wsTransactions.addRow([
                        item.userId,
                        item.paymentLink,
                        item.reason,
                        item.latestInvoice,
                        item.status,
                        item.paymentMethod,
                        item.tax,
                        item.total,
                        item.device,
                        item.planCreatedAt,
                        item.planExpiredAt
                    ]);
                }
                else if (dataType === 'Users') {
                    wsUsers.addRow([
                        item.firstName,
                        item.lastName,
                        item.email,
                        item.status,
                        item.image,
                        item.type,
                        item.isSignedUp,
                        item.device,
                        item.createdAt,
                    ]);
                }
            });
        });

        const dailyDevotionalExcelHeaderCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1'];
        const curatedExcelHeaderCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1'];
        const smallGroupExcelHeaderCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1'];
        const mostPopularExcelHeaderCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1', 'M1'];
        const booksExcelHeaderCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1', 'M1'];
        const transactionsExcelHeaderCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1'];
        const usersExcelHeaderCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'];

        await setHeaderBackgroundColor(dailyDevotionalExcelHeaderCells, wsForDailyDevotional);
        await setHeaderBackgroundColor(curatedExcelHeaderCells, wsCuratedList);
        await setHeaderBackgroundColor(smallGroupExcelHeaderCells, wsSmallGroup);
        await setHeaderBackgroundColor(mostPopularExcelHeaderCells, wsMostPopularBooks);
        await setHeaderBackgroundColor(booksExcelHeaderCells, wsBooks);
        await setHeaderBackgroundColor(transactionsExcelHeaderCells, wsTransactions);
        await setHeaderBackgroundColor(usersExcelHeaderCells, wsUsers);

        await setColumnWidth(wsForDailyDevotional);
        await setColumnWidth(wsCuratedList);
        await setColumnWidth(wsSmallGroup);
        await setColumnWidth(wsMostPopularBooks);
        await setColumnWidth(wsBooks);
        await setColumnWidth(wsTransactions);
        await setColumnWidth(wsUsers);

        await workbook.xlsx.writeFile(fileName);
        const xlsxFileStream = fs.readFileSync(fileName);
        fs.unlinkSync(fileName);
        response.send(xlsxFileStream)
        // return xlsxFileStream;
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export {
    exportData
}
